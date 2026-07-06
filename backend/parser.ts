import { parseConditionalTip } from './agent';

const COMMAND_VERBS = ['tip', 'bet', 'send', 'lock', 'put'];
const verbsPipe = COMMAND_VERBS.join('|');

// The Fast Path Regex for Tether Arena.
// Expected strict format: /tip @user 50 USDT on match_123
// Captures: 
// 1. Recipient handle (@user)
// 2. Amount (50)
// 3. Token (USDT/USDC)
// 4. Match ID or strict condition key (match_123)
const STRICT_PATTERN = new RegExp(
  `\\/?(?:${verbsPipe})\\s+@([a-zA-Z0-9_-]+)\\s+([\\d.]+)\\s*(USDT|USDC)?\\s+on\\s+([a-zA-Z0-9_-]+)`,
  'i'
);

export interface ParseResult {
  isFastPath: boolean;
  requiresConfirmation: boolean;
  payload?: any;
  error?: string;
}

/**
 * Hybrid Parser Engine
 * Tries the deterministic fast path first. If it fails, falls back to the Smart AI Agent.
 */
export async function parseCommand(message: string, platform: string, senderHandle: string): Promise<ParseResult> {
  // 1. THE FAST PATH (Deterministic Regex)
  const match = message.match(STRICT_PATTERN);

  if (match) {
    const recipient = `@${match[1]}`;
    const amount = parseFloat(match[2]);
    const token = match[3] ? match[3].toUpperCase() : 'USDT';
    const matchId = match[4];

    if (!isNaN(amount) && amount > 0) {
      console.log('⚡ Fast Path Matched!');
      return {
        isFastPath: true,
        requiresConfirmation: false, // Strict syntax means 100% confidence, no confirmation needed.
        payload: {
          intent: 'conditional_tip',
          senderHandle,
          recipientHandle: recipient,
          amount,
          token,
          condition: {
            matchId,
            teamSelected: 'home', // Assuming fast path requires knowing if it's home or away, or defaults to home. In a real scenario, the regex would capture the team.
          }
        }
      };
    }
  }

  // 2. THE SMART PATH (AI Fallback)
  console.log('🧠 Fast path failed. Falling back to AI Agent...');
  
  try {
    const aiPayload = await parseConditionalTip(message, platform, senderHandle);

    return {
      isFastPath: false,
      requiresConfirmation: true, // Safety Catch: AI is probabilistic, requires explicit user confirmation.
      payload: aiPayload,
    };
  } catch (err: any) {
    return {
      isFastPath: false,
      requiresConfirmation: false,
      error: `Could not parse command: ${err.message}`,
    };
  }
}
