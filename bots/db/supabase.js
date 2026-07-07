import { createClient } from '@supabase/supabase-js';

let supabase;

export function initSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  // M4 FIX: Throw immediately if credentials are missing — never silently use a placeholder
  if (!url || url === 'https://placeholder.supabase.co') {
    throw new Error('[DB] SUPABASE_URL is not configured. Set it in your .env file.');
  }
  if (!key || key === 'placeholder') {
    throw new Error('[DB] SUPABASE_SERVICE_KEY is not configured. Set it in your .env file.');
  }

  supabase = createClient(url, key);
}

export function getSupabase() {
  if (!supabase) initSupabase();
  return supabase;
}

export async function getWalletProfile(platform, userId) {
  const db = getSupabase();
  
  // The column name depends on the platform
  let column = '';
  if (platform === 'discord') column = 'discord_id';
  else if (platform === 'x' || platform === 'twitter') column = 'x_user_id';
  else if (platform === 'telegram') column = 'telegram_id';
  else throw new Error(`Unsupported platform for wallet lookup: ${platform}`);

  const { data, error } = await db
    .from('wallet_profiles')
    .select('wallet_address')
    .eq(column, String(userId))
    .single();

  if (error || !data) {
    return null; // Not connected
  }

  return data.wallet_address;
}

export async function insertConditionalPayment(data) {
  const db = getSupabase();
  const { error } = await db.from('conditional_payments').insert(data);
  if (error) throw error;
}

// ---- Social Queue Functions ----

export async function insertAgentTransaction(data) {
  const db = getSupabase();
  const { error } = await db.from('agent_transactions').insert(data);
  if (error) {
    // M4 FIX: Throw so callers know the transaction wasn't recorded
    console.error('[DB] Failed to insert agent transaction:', error);
    throw new Error(`[DB] insertAgentTransaction failed: ${error.message}`);
  }
}

export async function getUnrepliedTransactions(limit = 5, maxRetries = 3) {
  const db = getSupabase();
  const { data, error } = await db
    .from('agent_transactions')
    .select('*')
    .eq('replied', false)
    .lt('retry_count', maxRetries)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function markTransactionReplied(transactionId, skipReason = null) {
  const db = getSupabase();
  const update = { replied: true };
  if (skipReason) update.error_reason = skipReason;
  await db.from('agent_transactions').update(update).eq('id', transactionId);
}

export async function incrementTransactionRetry(transactionId) {
  const db = getSupabase();
  try {
    const { data: tx, error: fetchError } = await db
      .from('agent_transactions').select('retry_count').eq('id', transactionId).single();
    if (fetchError) throw fetchError;

    const { error: updateError } = await db.from('agent_transactions')
      .update({ retry_count: (tx?.retry_count || 0) + 1 })
      .eq('id', transactionId);
    if (updateError) throw updateError;
  } catch (err) {
    console.error(`  ❌ Failed to increment retry for ${transactionId}:`, err.message);
  }
}
