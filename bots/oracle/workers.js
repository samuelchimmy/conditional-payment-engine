import { syncMatchResults } from './sportsOracle.js';
import { evaluateJobs, processNotifications } from './resolver.js';
import { processSocialQueue } from '../socialQueue.js';

// Guarded runner: wraps a worker fn so a failure logs and continues,
// never throwing an unhandled rejection that could crash the process.
function guarded(name, fn) {
  return async () => {
    try {
      await fn();
    } catch (err) {
      console.error(`[Oracle] Worker "${name}" failed:`, err);
    }
  };
}

export function startOracleWorkers() {
  console.log('[Oracle] Starting oracle cron workers...');

  // Sync Match Results: every 3 minutes
  setInterval(guarded('syncMatchResults', syncMatchResults), 3 * 60 * 1000);

  // Evaluate Jobs: every 5 minutes
  setInterval(guarded('evaluateJobs', evaluateJobs), 5 * 60 * 1000);

  // Process Notifications: every 2 minutes
  setInterval(guarded('processNotifications', processNotifications), 2 * 60 * 1000);

  // Process Social Queue (X/Twitter replies): every 60 seconds
  // The queue enforces its own 30s per-reply spacing, so a 60s poll is fine.
  setInterval(guarded('processSocialQueue', processSocialQueue), 60 * 1000);
}
