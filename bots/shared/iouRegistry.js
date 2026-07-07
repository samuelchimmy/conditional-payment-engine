/**
 * bots/shared/iouRegistry.js
 * Multi-chain IOURegistry (MagicPay) helpers.
 * Re-exports the canonical implementations from discord-iou.js for cross-chain use.
 * Imported by telegram-iou.js and any future bot modules.
 */

export { MAGIC_PAY_ABI, getRecipientId, executeCreateMagicPay } from '../discord-iou.js';

/**
 * isIouSupported — Check whether MagicPay is deployed for a given chain.
 * @param {string} chain
 * @returns {boolean}
 */
export async function isIouSupported(chain) {
  try {
    const { getChainConfig } = await import('../chains.js');
    const cfg = getChainConfig(chain);
    return !!cfg.magicPayAddress;
  } catch {
    return false;
  }
}
