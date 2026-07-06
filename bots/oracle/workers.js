import { syncMatchResults } from './sportsOracle.js';
import { evaluateJobs, processNotifications } from './resolver.js';

export function startOracleWorkers() {
  console.log('[Oracle] Starting oracle cron workers...');
  
  // Sync Match Results: every 3 minutes
  setInterval(syncMatchResults, 3 * 60 * 1000);
  
  // Evaluate Jobs: every 5 minutes
  setInterval(evaluateJobs, 5 * 60 * 1000);
  
  // Process Notifications: every 2 minutes
  setInterval(processNotifications, 2 * 60 * 1000);
}
