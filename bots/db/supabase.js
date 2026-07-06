import { createClient } from '@supabase/supabase-js';

let supabase;

export function initSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn('[DB] Supabase credentials missing. Database operations will fail.');
  }
  supabase = createClient(
    process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'placeholder'
  );
}

export function getSupabase() {
  if (!supabase) initSupabase();
  return supabase;
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
    console.error('[DB] Failed to insert agent transaction:', error);
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
