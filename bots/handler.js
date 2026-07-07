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

  // Check confidence threshold based on review feedback
  if (intent.intentType !== 'unknown' && intent.confidence !== undefined && intent.confidence < 0.85) {
    return replyFn("I couldn't fully understand your conditions. Could you rephrase your bet? (e.g., 'Hey @tetherarena send $10 to @jade if Argentina wins Egypt')");
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

    const plugin = getPlugin('football_wc2026');
    if (!plugin) {
       return replyFn("❌ Condition plugin not found.");
    }

    const conditionData = plugin.parseConditionClause(intent.condition);
    if (!conditionData) {
      return replyFn("❌ Could not parse the match teams or outcome.");
    }

    // Resolve sender wallet from DB
    const { getWalletProfile } = await import('./db/supabase.js');
    const senderAddress = await getWalletProfile(platform, userId);
    
    if (!senderAddress) {
      throw new Error('wallet_not_connected');
    }
    
    const cleanRecipient = intent.recipient.replace('@', '');
    const recipientId = getRecipientId(platform, cleanRecipient);

    // Execute on-chain - trusted executor model uses bot's key on behalf of sender
    const { iouId, txHash } = await createConditionalIOU({
      senderAddress,
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

    const { insertAgentTransaction } = await import('./db/supabase.js');

    if (platform === 'x' || platform === 'twitter') {
      await insertAgentTransaction({
        platform,
        message_id: messageId,
        user_id: userId,
        intent_type: 'conditional_payment',
        amount: intent.amount,
        recipient: cleanRecipient,
        tx_hash: iouId.toString(),
      });
      return; // Handled by social queue
    } else {
      return replyFn(`🏟️ Escrow locked! ${intent.amount} USDT reserved for @${cleanRecipient}. IOU ID: ${iouId}`);
    }

  } catch (error) {
    console.error('[Handler] Conditional Payment Error:', error);
    
    let errorMsg = "❌ Failed to process conditional payment. Please try again later.";
    
    // Improved error responses for allowance/balance
    if (error.message.includes('wallet_not_connected')) {
       errorMsg = `❌ You need to connect your wallet first! Please visit: ${process.env.WEBAPP_URL || 'https://tarena.xyz'}/link-socials`;
    } else if (error.message.includes('ERROR_INSUFFICIENT_ALLOWANCE')) {
       errorMsg = `❌ You need to approve exactly ${intent.amount} USDT for the Arena contract. Please visit ${process.env.WEBAPP_URL || 'https://tarena.xyz'}/approve?amount=${intent.amount} to grant this specific allowance, then send your bet again.`;
    } else if (error.message.includes('ERROR_INSUFFICIENT_BALANCE')) {
       errorMsg = `❌ Your balance is too low to place this bet. Please deposit USDT in the app.`;
    }

    const { insertAgentTransaction } = await import('./db/supabase.js');
    if (platform === 'x' || platform === 'twitter') {
      await insertAgentTransaction({
        platform,
        message_id: messageId,
        user_id: userId,
        intent_type: 'conditional_payment',
        error_reason: errorMsg
      });
      return;
    }

    return replyFn(errorMsg);
  }
}
