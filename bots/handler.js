import { LRUCache } from 'lru-cache';
import { parseIntent } from './parser/intentParser.js';
import { preFilter } from './parser/preFilter.js';
import { IntentSchema } from './parser/intentSchema.js';
import { getPlugin } from './plugins/registry.js';
import { createConditionalIOU, getRecipientId } from './blockchain/iouV3.js';
import { insertConditionalPayment } from './db/supabase.js';

const rateLimiter = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 15, // 15 min
});

export async function handleMessage({ text, userId, messageId, platform, replyFn }) {
  console.log(`[Handler] Received message from ${platform} (user: ${userId}): ${text}`);
  
  // Step 1: Pre-filter (fast, no LLM)
  const signal = preFilter(text);
  if (!signal.isPaymentIntent) return; // Ignore unrelated messages

  // Step 2: Rate limit check
  const userKey = `${platform}:${userId}`;
  const currentCount = rateLimiter.get(userKey) || 0;
  if (currentCount > 10) {
    return replyFn("⏳ Too many requests, please try again in a few minutes.");
  }
  rateLimiter.set(userKey, currentCount + 1);

  // Step 3: LLM intent parsing
  let rawIntent = await parseIntent(text, platform);
  
  // Zod Validation
  const validationResult = IntentSchema.safeParse(rawIntent);
  let intent;
  
  if (!validationResult.success) {
    console.error('[Handler] Schema validation failed for intent:', validationResult.error);
    intent = { intentType: 'unknown' }; 
  } else {
    intent = validationResult.data;
  }

  // Step 4: Handle by intent type
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
      return;
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

    // Always assume Football WC2026 for now
    const plugin = getPlugin('football_wc2026');
    if (!plugin) {
       return replyFn("❌ Condition plugin not found.");
    }

    const conditionData = plugin.parseConditionClause(intent.condition);
    if (!conditionData) {
      return replyFn("❌ Could not parse the match teams or outcome.");
    }

    // Wait! In real life, we need the sender's blockchain address.
    // We assume the user has linked their wallet on the webapp and we query Supabase for it.
    // For this demonstration, we'll assume the executor sends it directly.
    // Ideally we'd look up `senderAddress` via Supabase.
    
    // We deterministically hash the recipient identity
    const cleanRecipient = intent.recipient.replace('@', '');
    const recipientId = getRecipientId(platform, cleanRecipient);

    replyFn("⏳ Processing your conditional payment...");

    // Execute on-chain
    const { iouId, txHash } = await createConditionalIOU({
      senderAddress: "0x0000000000000000000000000000000000000000", // Would be fetched from DB in prod
      amount: intent.amount,
      recipientId,
      conditionHash: conditionData.conditionHash,
      jobId: messageId
    });

    // Save to database
    await insertConditionalPayment({
      iou_id: iouId,
      platform,
      sender_id: userId,
      recipient_handle: cleanRecipient,
      amount: intent.amount,
      currency: intent.currency,
      condition_str: conditionData.conditionStr,
      condition_meta: conditionData.metadata,
      status: 'pending',
      tx_hash: txHash,
      created_at: new Date().toISOString()
    });

    return replyFn(`🏟️ Escrow locked! ${intent.amount} USDT reserved for @${cleanRecipient}. IOU ID: ${iouId}`);

  } catch (error) {
    console.error('[Handler] Conditional Payment Error:', error);
    if (error.message.includes('allowance')) {
       return replyFn(`❌ ${error.message}`);
    }
    return replyFn("❌ Failed to process conditional payment. Please try again later.");
  }
}
