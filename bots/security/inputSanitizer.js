/**
 * bots/security/inputSanitizer.js
 * Layer 1 + Layer 2: Input sanitization and prompt injection guard
 * Node.js port of _shared/inputSanitizer.ts
 */

const MAX_INPUT_LENGTH = 500;

// Layer 2: Injection patterns - compiled once for performance
const INJECTION_PATTERNS = [
  // Direct instruction overrides
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(everything|all|your)/i,
  /override\s+(your\s+)?(system|instructions|prompt)/i,
  /new\s+instructions?\s*:/i,
  /you\s+are\s+now\s+(?!tether|arena)/i,
  /act\s+as\s+(?!the\s+tether)/i,
  /pretend\s+you\s+are/i,

  // Persona hijacks
  /DAN\s+mode/i,
  /jailbreak/i,
  /developer\s+mode/i,
  /evil\s+mode/i,
  /unrestricted\s+mode/i,
  /act\s+as\s+admin/i,

  // System prompt extraction
  /repeat\s+(your\s+)?(system\s+)?prompt/i,
  /print\s+(your\s+)?(system\s+)?prompt/i,
  /show\s+(me\s+)?(your\s+)?(system\s+)?instructions/i,
  /what\s+(are\s+)?your\s+instructions/i,
  /reveal\s+(your\s+)?(system|prompt|instructions)/i,

  // JSON/code injection
  /```(json|javascript|python|bash|sh)/i,
  /<\s*script\b/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,

  // Context escape attempts
  /\]\s*\[/,
  /<\/?(user|system|assistant)_?message>/i,
  /\|\|\s*system\s*\|/i,
];

// Unicode homoglyph normalization map (common lookalikes)
const HOMOGLYPH_MAP = {
  'а': 'a', 'е': 'e', 'і': 'i', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y',
  'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O',
  'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'І': 'I',
  '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
  '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
};

function normalizeHomoglyphs(text) {
  return text.split('').map(c => HOMOGLYPH_MAP[c] || c).join('');
}

function stripHtmlAndJson(text) {
  // Strip HTML/XML tags
  let clean = text.replace(/<[^>]{0,200}>/g, ' ');
  // Strip inline JSON blocks
  clean = clean.replace(/\{[^}]{0,300}\}/g, (match) => {
    // Keep currency/amount objects but strip instruction-like ones
    if (/instruction|prompt|system|ignore/i.test(match)) return '';
    return match;
  });
  // Strip HTML comments
  clean = clean.replace(/<!--[\s\S]{0,500}?-->/g, '');
  // Normalize whitespace
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

/**
 * Sanitize and validate user input through all security layers.
 * Returns { safe: boolean, text: string, reason?: string }
 */
export function sanitizeInput(raw) {
  if (typeof raw !== 'string') {
    return { safe: false, reason: 'invalid_type' };
  }

  // Layer 1a: Size limit
  if (raw.length > MAX_INPUT_LENGTH) {
    return { safe: false, reason: 'too_long', text: raw.substring(0, MAX_INPUT_LENGTH) };
  }

  // Layer 1b: Unicode normalization
  let text = normalizeHomoglyphs(raw);

  // Layer 1c: Strip HTML, hidden JSON
  text = stripHtmlAndJson(text);

  // Layer 2: Prompt injection guard
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'injection_detected', text };
    }
  }

  return { safe: true, text };
}
