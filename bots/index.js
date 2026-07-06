import 'dotenv/config';

// 1. Validate required environment variables
const REQUIRED_ENV_VARS = [
  'GEMINI_API_KEY',
  'VAULT_PRIVATE_KEY',
  'EXECUTOR_PRIVATE_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  // Assuming these are also critical to start
  'X_BEARER_TOKEN',
  'DISCORD_BOT_TOKEN',
  'TELEGRAM_BOT_TOKEN',
];

for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    console.error(`❌ FATAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

import { loadPluginRegistry } from './plugins/registry.js';
import { startXAdapter } from './adapters/x.adapter.js';
import { startDiscordAdapter } from './adapters/discord.adapter.js';
import { startTelegramAdapter } from './adapters/telegram.adapter.js';
import { startOracleWorkers } from './oracle/workers.js';

async function bootstrap() {
  try {
    console.log('Bootstrapping Tether Arena Agent...');

    // 2. Load plugin registry from Supabase
    await loadPluginRegistry();

    // 3. Start platform adapters concurrently
    await Promise.all([
      startXAdapter(),
      startDiscordAdapter(),
      startTelegramAdapter(),
    ]);

    // 4. Start oracle cron workers
    startOracleWorkers();

    // 5. Log success
    console.log('✅ Tether Arena Agent running successfully');
  } catch (error) {
    console.error('❌ Failed to bootstrap agent:', error);
    process.exit(1);
  }
}

bootstrap();
