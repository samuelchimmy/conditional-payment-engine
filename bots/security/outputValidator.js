/**
 * bots/security/outputValidator.js
 * Layer 4: Output schema validation after AI parsing
 * Node.js port of _shared/outputValidator.ts
 */

const MAX_AMOUNT = 10_000;
const MAX_RECIPIENTS = 50;

const FORBIDDEN_RECIPIENTS = new Set([
  'everyone', 'here', 'channel', 'bot', 'admin', 'moderator', 'mod',
  'tarena', 'tether', 'arena', 'tetherarena', 'tetherbot', 'tetherareana',
  'null', 'undefined', 'nobody', 'anonymous', 'anon',
]);

const ALLOWED_TYPES = new Set([
  'conditional_payment', 'simple_payment', 'claim', 'balance', 'injection_attempt'
]);

// Tether Arena settles exclusively on Celo (native USDT + CIP-64 gas-in-USDT).
const ALLOWED_CHAINS = new Set(['celo']);

/**
 * Validates the parsed command from the AI.
 * Returns { valid: boolean, reason?: string, command?: object }
 */
export function validateParsedCommand(command) {
  if (!command || typeof command !== 'object') {
    return { valid: false, reason: 'invalid_command_object' };
  }

  // Check if AI self-flagged an injection
  if (command._rejected === 'injection_detected' || command.intentType === 'injection_attempt') {
    return { valid: false, reason: 'ai_rejected_injection' };
  }

  // Validate intent type
  if (!ALLOWED_TYPES.has(command.intentType)) {
    return { valid: false, reason: `unsupported_intent_type: ${command.intentType}` };
  }

  // Non-financial commands are always valid (just pass through)
  if (['claim', 'balance', 'unknown'].includes(command.intentType)) {
    return { valid: true, command };
  }

  // For payment intents: validate amount
  if (command.amount !== null && command.amount !== undefined) {
    const amount = Number(command.amount);
    if (isNaN(amount) || amount <= 0) {
      return { valid: false, reason: 'invalid_amount' };
    }
    if (amount > MAX_AMOUNT) {
      return { valid: false, reason: `amount_exceeds_cap: ${amount} > ${MAX_AMOUNT}` };
    }
  }

  // Validate recipient
  if (command.recipient) {
    const handle = command.recipient.replace(/^@/, '').toLowerCase().trim();

    if (FORBIDDEN_RECIPIENTS.has(handle)) {
      return { valid: false, reason: `forbidden_recipient: ${handle}` };
    }

    // Sanitize: only alphanumeric + underscore
    if (!/^[a-z0-9_]{1,50}$/.test(handle)) {
      return { valid: false, reason: 'invalid_recipient_format' };
    }
  }

  // Validate recipients array (for multi-send)
  if (Array.isArray(command.recipients)) {
    if (command.recipients.length > MAX_RECIPIENTS) {
      return { valid: false, reason: `too_many_recipients: ${command.recipients.length} > ${MAX_RECIPIENTS}` };
    }
    for (const r of command.recipients) {
      const handle = (r.handle || r).replace(/^@/, '').toLowerCase().trim();
      if (FORBIDDEN_RECIPIENTS.has(handle)) {
        return { valid: false, reason: `forbidden_recipient_in_list: ${handle}` };
      }
    }
  }

  return { valid: true, command };
}
