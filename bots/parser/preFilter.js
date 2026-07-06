export function preFilter(text) {
  if (!text || typeof text !== 'string') {
    return { isPaymentIntent: false };
  }

  const lowercase = text.toLowerCase();

  // Basic regex keywords for intent routing
  const paymentKeywords = ['send', 'pay', 'give', 'bet', 'tip', 'reward'];
  const infoKeywords = ['claim', 'balance', 'mybets', 'status'];
  
  // If the message is a command explicitly (like /claim or /balance), or has keywords
  const isPaymentIntent = paymentKeywords.some(kw => lowercase.includes(kw)) || 
                          infoKeywords.some(kw => lowercase.includes(kw));

  return { isPaymentIntent };
}
