import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseClient;
}

export async function insertConditionalPayment(paymentData) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('conditional_payments')
    .insert(paymentData);
  if (error) {
    console.error('[DB] Failed to insert conditional payment:', error);
    throw error;
  }
}

export async function updatePaymentStatus(iouId, status, resolvedInFavor = null) {
  const supabase = getSupabase();
  const updateData = { status };
  if (resolvedInFavor !== null) updateData.resolved_in_favor = resolvedInFavor;

  const { error } = await supabase
    .from('conditional_payments')
    .update(updateData)
    .eq('iou_id', iouId);
    
  if (error) {
    console.error(`[DB] Failed to update payment status for iouId ${iouId}:`, error);
    throw error;
  }
}
