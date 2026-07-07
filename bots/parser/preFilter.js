const ENGLISH_VERBS = [
  'send', 'pay', 'give', 'bet', 'tip', 'reward', 'transfer', 'deposit', 
  'wire', 'wager', 'stake', 'claim', 'balance', 'mybets', 'status'
];

const PIDGIN_VERBS = [
  'dash', 'settle', 'chook', 'spray', 'jolly', 'whack', 'flow',
  'bless', 'slide', 'airdrop', 'nak', 'wack', 'bam', 'shack', 'chop'
];

const ALL_KEYWORDS = [...ENGLISH_VERBS, ...PIDGIN_VERBS];

// Build a dynamic regex with word boundaries to prevent false positives
// e.g., \b(dash|send|pay)\b matches "dash" but not "dashboard"
const keywordRegex = new RegExp(`\\b(${ALL_KEYWORDS.join('|')})\\b`, 'i');

export function preFilter(text) {
  if (!text || typeof text !== 'string') {
    return { isPaymentIntent: false };
  }

  // Fast Regex test using word boundaries
  const isPaymentIntent = keywordRegex.test(text);

  return { isPaymentIntent };
}
