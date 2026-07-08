import { LRUCache } from 'lru-cache';
import { parseIntent } from './parser/intentParser.js';
import { preFilter } from './parser/preFilter.js';
import { IntentSchema } from './parser/intentSchema.js';
import { getPlugin } from './plugins/registry.js';
import { createConditionalIOU, getRecipientId } from './blockchain/iouV3.js';
import { insertConditionalPayment } from './db/supabase.js';
import { sanitizeInput } from './security/inputSanitizer.js';
import { validateParsedCommand } from './security/outputValidator.js';
import { resolveRecipientToId } from './security/recipientResolver.js';

// Rate limiter: 5 requests per 60-second window per platform:userId (spec requirement)
const rateLimiter = new LRUCache({
  max: 1000,
  ttl: 1000 * 60, // 1 minute window
});

const RATE_LIMIT_MAX = 5; // 5 per minute per wallet (spec)

export async function handleMessage({ text, userId, messageId, platform, replyFn }) {
  console.log(`[Handler] Received message from ${platform} (user: ${userId}): ${text?.substring(0, 80)}`);

  // ── Layer 1 + Layer 2: Input sanitization & injection guard ──
  const sanitized = sanitizeInput(text);
  if (!sanitized.safe) {
    console.warn(`[Handler] Input blocked (${sanitized.reason}) from ${platform}:${userId}`);
    if (sanitized.reason === 'injection_detected') {
      return replyFn('⛔ Message blocked: contains prohibited content.');
    }
    if (sanitized.reason === 'too_long') {
      return replyFn('❌ Message too long. Please keep commands under 500 characters.');
    }
    return; // drop silently for other reasons
  }
  const cleanText = sanitized.text;

  // ── Pre-filter (fast, no LLM) ──
  const signal = preFilter(cleanText);
  if (!signal.isPaymentIntent) return;

  // ── Rate limit check: 5/min per platform:userId ──
  const userKey = `${platform}:${userId}`;
  const currentCount = rateLimiter.get(userKey) || 0;
  if (currentCount >= RATE_LIMIT_MAX) {
    return replyFn(`⏳ Too many requests. Please wait a moment before trying again.`);
  }
  rateLimiter.set(userKey, currentCount + 1);

  // ── Layer 3: LLM intent parsing with isolated input ──
  let rawIntent = await parseIntent(cleanText, platform);

  // ── Zod schema validation ──
  const validationResult = IntentSchema.safeParse(rawIntent);
  let intent;

  if (!validationResult.success) {
    console.error('[Handler] Schema validation failed:', validationResult.error);
    intent = { intentType: 'unknown' };
  } else {
    intent = validationResult.data;
  }

  // ── Layer 4: Output validation ($10k cap, blocklist, recipient sanitization) ──
  const outputValidation = validateParsedCommand(intent);
  if (!outputValidation.valid) {
    console.warn(`[Handler] Output validation blocked: ${outputValidation.reason} from ${platform}:${userId}`);
    if (outputValidation.reason === 'ai_rejected_injection') {
      return replyFn('⛔ Command blocked: potential injection attempt detected.');
    }
    if (outputValidation.reason?.startsWith('amount_exceeds_cap')) {
      return replyFn('❌ Amount exceeds the $10,000 maximum per transaction.');
    }
    if (outputValidation.reason?.startsWith('forbidden_recipient')) {
      return replyFn('❌ Invalid recipient. You cannot send to that handle.');
    }
    return replyFn("❌ Could not process command. Please check your message and try again.");
  }

  // Confidence threshold check
  if (intent.intentType !== 'unknown' && intent.intentType !== 'injection_attempt' && intent.confidence !== undefined && intent.confidence < 0.85) {
    return replyFn("I couldn't fully understand your conditions. Could you rephrase your bet? (e.g., 'Hey @tetherarena send $10 to @jade if Argentina wins Egypt')");
  }

  // ── Route by intent type ──
  switch (intent.intentType) {
    case 'conditional_payment':
      return handleConditionalPayment(intent, { userId, platform, messageId, replyFn });
    case 'simple_payment':
      return replyFn(`⏳ Parsed simple payment for ${intent.amount} ${intent.currency}`);
    case 'claim':
      return replyFn(`⏳ Use /claim in our webapp to check claims.`);
    case 'balance':
      return replyFn(`⏳ Please visit our webapp to check your balance.`);
    case 'injection_attempt':
      console.warn(`[Handler] Injection attempt blocked from ${userId}: ${intent.refusalReason}`);
      return replyFn('⛔ Message blocked: potential injection attempt detected.');
    case 'unknown':
    default:
      return;
  }
}

async function handleConditionalPayment(intent, { userId, platform, messageId, replyFn }) {
  try {
    if (!intent.amount || !intent.recipient || !intent.condition) {
      return replyFn("❌ Missing required payment details (amount, recipient, or condition).");
    }

    const plugin = getPlugin('football_wc2026');
    if (!plugin) {
      return replyFn("❌ Condition plugin not found.");
    }

    const conditionData = plugin.parseConditionClause(intent.condition);
    if (!conditionData || !conditionData.conditionHash) {
      return replyFn("❌ Could not parse the match teams or outcome.");
    }

    // Resolve sender wallet from DB
    const { getWalletProfile } = await import('./db/supabase.js');
    const senderAddress = await getWalletProfile(platform, userId);

    if (!senderAddress) {
      throw new Error('wallet_not_connected');
    }

    // ── C1: Resolve recipient by immutable platform numeric ID ──
    const recipientHandle = intent.recipient.replace('@', '');
    const { numericId, isRegistered } = await resolveRecipientToId(platform, recipientHandle);

    // Use numeric ID if resolved, fall back to handle (unregistered escrow path)
    const resolvedId = numericId || recipientHandle;
    const recipientId = getRecipientId(platform, resolvedId);

    // M-2: deterministic self-send guard (don't rely on the LLM alone).
    const senderRecipientId = getRecipientId(platform, String(userId));
    if (recipientId === senderRecipientId) {
      return replyFn("❌ You can't send a conditional payment to yourself.");
    }

    console.log(`[Handler] Recipient: @${recipientHandle} → numericId: ${resolvedId} → recipientId: ${recipientId}`);

    // Execute on-chain
    const { iouId, txHash } = await createConditionalIOU({
      senderAddress,
      amount: intent.amount,
      recipientId,
      conditionHash: conditionData.conditionHash,
      jobId: messageId
    });

    // M-3: the tx succeeded on-chain; use txHash as the DB reference even if the
    // iouId couldn't be decoded from the event (never let a null iouId throw).
    const iouRef = iouId != null ? String(iouId) : null;

    // Save to database
    await insertConditionalPayment({
      iou_id: iouRef,
      platform,
      sender_id: userId,
      recipient_handle: recipientHandle,
      recipient_numeric_id: resolvedId,  // store the resolved ID
      amount: intent.amount,
      currency: intent.currency,
      condition_str: conditionData.conditionStr,
      condition_meta: conditionData.metadata,
      status: 'pending',
      tx_hash: txHash,
      created_at: new Date().toISOString()
    });

    const { insertAgentTransaction } = await import('./db/supabase.js');

    if (platform === 'x' || platform === 'twitter') {
      await insertAgentTransaction({
        platform,
        message_id: messageId,
        user_id: userId,
        intent_type: 'conditional_payment',
        amount: intent.amount,
        recipient: recipientHandle,
        tx_hash: iouRef || txHash,
      });
      return; // Handled by social queue
    } else {
      const registrationNote = isRegistered ? '' : `\n⚠️ @${recipientHandle} hasn't connected their wallet yet. Funds are safely escrowed.`;
      return replyFn(`🏟️ Escrow locked! ${intent.amount} USDT reserved for @${recipientHandle}. IOU ID: ${iouId}${registrationNote}`);
    }

  } catch (error) {
    console.error('[Handler] Conditional Payment Error:', error);

    let errorMsg = "❌ Failed to process conditional payment. Please try again later.";

    if (error.message.includes('wallet_not_connected')) {
      errorMsg = `❌ You need to connect your wallet first! Please visit: ${process.env.WEBAPP_URL || 'https://tarena.xyz'}/link-socials`;
    } else if (error.message.includes('ERROR_INSUFFICIENT_ALLOWANCE')) {
      errorMsg = `❌ You need to approve exactly ${intent.amount} USDT for the Arena contract. Please visit ${process.env.WEBAPP_URL || 'https://tarena.xyz'}/approve?amount=${intent.amount} to grant this specific allowance, then send your bet again.`;
    } else if (error.message.includes('ERROR_INSUFFICIENT_BALANCE')) {
      errorMsg = `❌ Your balance is too low to place this bet. Please deposit USDT in the app.`;
    }

    const { insertAgentTransaction } = await import('./db/supabase.js');
    if (platform === 'x' || platform === 'twitter') {
      // Sanitize error before storing (never echo raw error_reason back to users via tweet)
      const safeError = errorMsg.substring(0, 200);
      await insertAgentTransaction({
        platform,
        message_id: messageId,
        user_id: userId,
        intent_type: 'conditional_payment',
        error_reason: safeError
      });
      return;
    }

    return replyFn(errorMsg);
  }
}
