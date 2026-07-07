import { getUnrepliedTransactions, markTransactionReplied, incrementTransactionRetry } from './db/supabase.js';
// We would import the twitter adapter, but for a multi-platform architecture, 
// we should dynamically fetch the right adapter based on the platform.
// For now, let's assume we have an adapter registry or we just handle X.
import { replyToTweet } from './adapters/x.adapter.js';

const MAX_RETRY_COUNT = 3;

// Rate limit state
const RL = {
  lastReplyAt: 0,
  minSpacingMs: 30 * 1000,
};

function checkRateLimit() {
  const now = Date.now();
  const elapsed = now - RL.lastReplyAt;
  if (elapsed < RL.minSpacingMs) {
    const waitSec = Math.ceil((RL.minSpacingMs - elapsed) / 1000);
    return { allowed: false, waitSec };
  }
  return { allowed: true };
}

function recordReply() {
  RL.lastReplyAt = Date.now();
  console.log('[SocialQueue] Reply recorded. 30s cooldown started.');
}

export async function processSocialQueue() {
  try {
    const queue = await getUnrepliedTransactions(5, MAX_RETRY_COUNT);

    if (!queue.length) return;

    for (const tx of queue) {
      // Only process X/Twitter through the slow queue
      if (tx.platform !== 'x' && tx.platform !== 'twitter') {
        await markTransactionReplied(tx.id, 'SKIPPED_NON_X_PLATFORM');
        continue;
      }

      const rl = checkRateLimit();
      if (!rl.allowed) {
        console.log(`[SocialQueue] Spacing replies. ${rl.waitSec}s remaining.`);
        break; // Stop processing this cycle
      }

      try {
        console.log(`[SocialQueue] Generating reply for ${tx.message_id}...`);
        
        let text = '';
        if (tx.error_reason) {
          // Sanitize: never echo raw internal error messages to users
          // Use a fixed friendly message instead
          text = `❌ We couldn't process your request. Please visit ${process.env.WEBAPP_URL || 'https://tarena.xyz'} to check status.`;
        } else if (tx.tx_hash) {
          if (tx.intent_type === 'conditional_payment') {
            text = `🏟️ Escrow locked! ${tx.amount} USDT reserved for @${tx.recipient}. IOU ID: ${tx.tx_hash}`;
          } else {
             text = `✅ Transaction completed: ${tx.tx_hash}`;
          }
        } else {
          text = `🤖 Command received. Processing...`;
        }

        await replyToTweet(tx.message_id, text);
        
        recordReply();
        await markTransactionReplied(tx.id);
        
      } catch (err) {
        console.error(`[SocialQueue] Failed to reply to ${tx.message_id}:`, err);
        await incrementTransactionRetry(tx.id);
      }
    }
  } catch (err) {
    console.error('[SocialQueue] Queue processing error:', err);
  }
}
