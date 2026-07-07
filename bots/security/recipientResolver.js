/**
 * bots/security/recipientResolver.js
 * Resolves recipient display handles to immutable platform numeric IDs.
 * Prevents username-hijacking attacks (C1).
 */

import { getSupabase } from '../db/supabase.js';

/**
 * Resolve a recipient @handle to their immutable platform user ID.
 * Strategy:
 * 1. Check our DB for registered users by handle → return their stored numeric ID
 * 2. Fall back to platform API if available (X only for now)
 * 3. Return null if unresolvable (funds will sit in escrow until recipient registers)
 *
 * @param {string} platform - 'x' | 'discord' | 'telegram'
 * @param {string} handle - Display handle (without @)
 * @returns {Promise<{ numericId: string | null, isRegistered: boolean }>}
 */
export async function resolveRecipientToId(platform, handle) {
  const cleanHandle = handle.replace(/^@/, '').toLowerCase().trim();

  // Step 1: Check our database first — fastest path
  const supabase = getSupabase();
  if (supabase) {
    try {
      let query = supabase.from('wallet_profiles').select('x_user_id, discord_id, telegram_id');

      if (platform === 'x' || platform === 'twitter') {
        query = query.ilike('x_username', cleanHandle);
      } else if (platform === 'discord') {
        query = query.ilike('discord_username', cleanHandle);
      } else if (platform === 'telegram') {
        query = query.ilike('telegram_username', cleanHandle);
      }

      const { data } = await query.maybeSingle();

      if (data) {
        const numericId =
          platform === 'x' || platform === 'twitter' ? data.x_user_id :
          platform === 'discord' ? data.discord_id :
          platform === 'telegram' ? data.telegram_id : null;

        if (numericId) {
          return { numericId: String(numericId), isRegistered: true };
        }
      }
    } catch (e) {
      console.warn('[RecipientResolver] DB lookup failed:', e.message);
    }
  }

  // Step 2: Platform API fallback (X/Twitter only — Discord/Telegram don't expose public lookup)
  if ((platform === 'x' || platform === 'twitter') && process.env.X_BEARER_TOKEN) {
    try {
      const res = await fetch(
        `https://api.x.com/2/users/by/username/${encodeURIComponent(cleanHandle)}?user.fields=id,username`,
        { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } }
      );

      if (res.ok) {
        const data = await res.json();
        if (data?.data?.id) {
          console.log(`[RecipientResolver] Resolved @${cleanHandle} → Twitter ID ${data.data.id}`);
          return { numericId: data.data.id, isRegistered: false };
        }
      } else if (res.status === 404) {
        // User doesn't exist on platform
        return { numericId: null, isRegistered: false };
      }
    } catch (e) {
      console.warn('[RecipientResolver] Twitter API lookup failed:', e.message);
    }
  }

  // Step 3: Cannot resolve — use a deterministic hash of the handle as fallback
  // This means funds will route to escrow awaiting the recipient to register
  console.warn(`[RecipientResolver] Could not resolve ${platform}:${cleanHandle} to numeric ID. Using handle as recipient (unregistered escrow).`);
  return { numericId: null, isRegistered: false };
}
