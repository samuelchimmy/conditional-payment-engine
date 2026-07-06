import { getSupabase } from '../db/supabase.js';
import { getPlugin } from '../plugins/registry.js';
import { resolveConditional } from '../blockchain/iouV3.js';

export async function evaluateJobs() {
  console.log('[Resolver] Evaluating pending conditional jobs...');
  try {
    const supabase = getSupabase();
    
    // 1. Fetch pending conditional_payments from Supabase
    const { data: pendingJobs, error } = await supabase
      .from('conditional_payments')
      .select('*')
      .eq('status', 'pending');
      
    if (error) throw error;
    if (!pendingJobs || pendingJobs.length === 0) return;

    console.log(`[Resolver] Found ${pendingJobs.length} pending jobs.`);

    // 2. Fetch all recently finished matches
    // In a real app we might only fetch the ones we need, but for simplicity fetch all finished
    const { data: matches, error: matchError } = await supabase
      .from('sports_match_results')
      .select('*')
      .eq('status', 'finished');

    if (matchError) throw matchError;

    // 3. Evaluate each job
    const plugin = getPlugin('football_wc2026'); // Assuming all are football for now
    
    for (const job of pendingJobs) {
      if (!job.condition_meta) continue;

      const { teamA, teamB } = job.condition_meta;

      // Find the match in the finished matches
      // A match must contain both teamA and teamB (or if teamB is omitted, just teamA)
      const match = matches.find(m => 
        (m.home_team === teamA || m.away_team === teamA) &&
        (teamB ? (m.home_team === teamB || m.away_team === teamB) : true)
      );

      if (!match) continue; // Match not found or not finished

      // 4. Evaluate condition
      // evaluateCondition returns true, false, or null (if not finished)
      // We map this to matchData shape expected by evaluateCondition
      const matchData = {
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        homeScore: match.home_score,
        awayScore: match.away_score,
        status: match.status === 'finished' ? 'FINISHED' : match.status
      };

      const result = plugin.evaluateCondition(job.condition_meta, matchData);
      
      if (result === null) continue; // Still pending?

      const resolvedInFavor = result ? 1 : 0; // 1 = recipient wins, 0 = sender wins (refund)
      console.log(`[Resolver] Job ${job.iou_id} resolved in favor of: ${resolvedInFavor}`);

      // 5. Call resolveConditional(iouId, resolvedInFavor) on chain
      try {
        const txHash = await resolveConditional(job.iou_id, resolvedInFavor);
        console.log(`[Resolver] Blockchain resolution successful for IOU ${job.iou_id}: ${txHash}`);
        
        // 6. Update row status to resolved
        await supabase
          .from('conditional_payments')
          .update({ status: 'resolved', resolved_in_favor: resolvedInFavor, resolution_tx: txHash })
          .eq('iou_id', job.iou_id);
          
      } catch (blockchainError) {
         console.error(`[Resolver] Blockchain resolution failed for IOU ${job.iou_id}:`, blockchainError);
      }
    }
  } catch (err) {
    console.error('[Resolver] Error evaluating jobs:', err);
  }
}

export async function processNotifications() {
  console.log('[Resolver] Processing MagicPay claim notifications...');
  // Logic to notify users of pending claims via DM
  // This would typically involve querying users who have claims but haven't connected a wallet
}
