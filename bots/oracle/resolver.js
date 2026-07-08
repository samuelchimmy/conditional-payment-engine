import { getSupabase } from '../db/supabase.js';
import { getPlugin } from '../plugins/registry.js';
import { resolveConditional, claimConditional, getRecipientId } from '../blockchain/iouV3.js';
import { resolveAlias } from '../plugins/football.plugin.js';

// Contract winner flags (must match IOURegistryV3): 1 = sender wins, 2 = recipient wins.
const SENDER_WIN = 1;
const RECIPIENT_WIN = 2;

export async function evaluateJobs() {
  console.log('[Resolver] Evaluating pending conditional jobs...');
  try {
    const supabase = getSupabase();

    // 1. Fetch pending conditional_payments
    const { data: pendingJobs, error } = await supabase
      .from('conditional_payments')
      .select('*')
      .eq('status', 'pending');

    if (error) throw error;
    if (!pendingJobs || pendingJobs.length === 0) return;

    console.log(`[Resolver] Found ${pendingJobs.length} pending jobs.`);

    // 2. Fetch all recently finished matches
    const { data: matches, error: matchError } = await supabase
      .from('sports_match_results')
      .select('*')
      .eq('status', 'finished');

    if (matchError) throw matchError;

    const plugin = getPlugin('football_wc2026'); // Assuming all are football for now

    for (const job of pendingJobs) {
      if (!job.condition_meta) continue;

      // H-1: normalize BOTH sides through the same alias map so oracle-stored
      // API names (e.g. "korea republic") match bet aliases (e.g. "south korea").
      const teamA = resolveAlias(job.condition_meta.teamA);
      const teamB = resolveAlias(job.condition_meta.teamB);

      const match = matches.find((m) => {
        const home = resolveAlias(m.home_team);
        const away = resolveAlias(m.away_team);
        return (
          (home === teamA || away === teamA) &&
          (teamB ? home === teamB || away === teamB : true)
        );
      });

      if (!match) continue; // Match not found or not finished

      const matchData = {
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        homeScore: match.home_score,
        awayScore: match.away_score,
        status: match.status === 'finished' ? 'FINISHED' : match.status,
      };

      const result = plugin.evaluateCondition(job.condition_meta, matchData);
      if (result === null) continue; // Not decidable yet

      // CR-1: contract expects 2 = recipient wins, 1 = sender wins (refund). NOT 1/0.
      const resolvedInFavor = result ? RECIPIENT_WIN : SENDER_WIN;
      console.log(`[Resolver] Job ${job.iou_id} resolves in favor of ${resolvedInFavor === RECIPIENT_WIN ? 'recipient' : 'sender'}`);

      // H-2: claim the job (pending -> resolving) so a mid-flight crash can't
      // double-resolve on the next cycle.
      const { data: claimed } = await supabase
        .from('conditional_payments')
        .update({ status: 'resolving' })
        .eq('iou_id', job.iou_id)
        .eq('status', 'pending')
        .select();
      if (!claimed || claimed.length === 0) continue; // another cycle grabbed it

      try {
        const txHash = await resolveConditional(job.iou_id, resolvedInFavor);
        console.log(`[Resolver] Resolved IOU ${job.iou_id} on-chain: ${txHash}`);
        await supabase
          .from('conditional_payments')
          .update({ status: 'resolved', resolved_in_favor: resolvedInFavor, resolution_tx: txHash })
          .eq('iou_id', job.iou_id);
      } catch (blockchainError) {
        const msg = blockchainError?.message || String(blockchainError);
        if (/already\s*resolved|alreadyresolved/i.test(msg)) {
          // Idempotent: it was already resolved on-chain — sync DB and move on.
          await supabase
            .from('conditional_payments')
            .update({ status: 'resolved', resolved_in_favor: resolvedInFavor })
            .eq('iou_id', job.iou_id);
        } else {
          console.error(`[Resolver] Resolution failed for IOU ${job.iou_id}, will retry:`, msg);
          // Put it back to pending so the next cycle retries.
          await supabase
            .from('conditional_payments')
            .update({ status: 'pending' })
            .eq('iou_id', job.iou_id);
        }
      }
    }
  } catch (err) {
    console.error('[Resolver] Error evaluating jobs:', err);
  }
}

/**
 * CR-2: settle claims on-chain. The webapp's secure-claim edge function verifies
 * the recipient's signature and sets status='claimed' + recipient_wallet. This
 * worker (vault authority) then actually moves the USDT out of escrow via
 * claimConditional — previously nothing ever called it, so claims never paid.
 */
export async function processClaims() {
  try {
    const supabase = getSupabase();

    const { data: jobs, error } = await supabase
      .from('conditional_payments')
      .select('*')
      .eq('status', 'claimed')
      .not('recipient_wallet', 'is', null);

    if (error) throw error;
    if (!jobs || jobs.length === 0) return;

    console.log(`[Resolver] Settling ${jobs.length} claimed job(s) on-chain...`);

    for (const job of jobs) {
      // Only recipient-win escrows are claimable.
      if (job.resolved_in_favor !== RECIPIENT_WIN) continue;

      const recipientId = getRecipientId(
        job.platform,
        String(job.recipient_numeric_id || job.recipient_handle || '')
      );

      // Idempotency: claim the row (claimed -> settling) before sending.
      const { data: claimed } = await supabase
        .from('conditional_payments')
        .update({ status: 'settling' })
        .eq('iou_id', job.iou_id)
        .eq('status', 'claimed')
        .select();
      if (!claimed || claimed.length === 0) continue;

      try {
        const txHash = await claimConditional(job.iou_id, job.recipient_wallet, recipientId);
        console.log(`[Resolver] Claim settled for IOU ${job.iou_id}: ${txHash}`);
        await supabase
          .from('conditional_payments')
          .update({ status: 'settled', claim_tx: txHash })
          .eq('iou_id', job.iou_id);
      } catch (e) {
        const msg = e?.message || String(e);
        if (/already\s*claimed|alreadyclaimed/i.test(msg)) {
          await supabase
            .from('conditional_payments')
            .update({ status: 'settled' })
            .eq('iou_id', job.iou_id);
        } else {
          console.error(`[Resolver] Claim settlement failed for IOU ${job.iou_id}, will retry:`, msg);
          await supabase
            .from('conditional_payments')
            .update({ status: 'claimed' })
            .eq('iou_id', job.iou_id);
        }
      }
    }
  } catch (err) {
    console.error('[Resolver] Error settling claims:', err);
  }
}

export async function processNotifications() {
  // Placeholder — MagicPay claim reminders are surfaced in the webapp (History
  // badge + toast). Kept as a no-op so the worker slot stays wired.
}
