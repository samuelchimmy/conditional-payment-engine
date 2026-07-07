import { supabase } from "@/lib/supabaseClient";

/**
 * Central gateway for all database operations.
 * The frontend MUST NEVER call supabase.from() directly.
 * Every read and write goes through the db-proxy Edge Function.
 */
export async function callDbProxy<T = any>(
  action: string,
  walletAddress: string,
  extra?: Record<string, any>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tarena_jwt') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await supabase.functions.invoke("db-proxy", {
      body: { action, walletAddress, ...extra },
      headers,
    });

    if (response.error) {
      console.error(`[db-proxy:${action}] Function error:`, response.error);
      return { data: null, error: response.error.message || "Edge function error" };
    }

    if (response.data?.error) {
      console.error(`[db-proxy:${action}] API error:`, response.data.error);
      return { data: null, error: response.data.error };
    }

    return { data: response.data?.data ?? response.data, error: null };
  } catch (err: any) {
    console.error(`[db-proxy:${action}] Unexpected error:`, err);
    return { data: null, error: err.message || "Unknown error" };
  }
}

// ─── Typed convenience wrappers ───────────────────────────────────────────────

export async function getProfile(walletAddress: string) {
  return callDbProxy<any>("get-profile", walletAddress);
}

export async function getBets(walletAddress: string) {
  return callDbProxy<{ bets: any[]; userHandles: string[] }>("get-bets", walletAddress);
}

export async function insertPayment(walletAddress: string, payment: {
  iou_id: string;
  platform: string;
  recipient_handle: string;
  amount: string;
  currency: string;
  condition_str: string;
  tx_hash?: string;
}) {
  return callDbProxy<any>("insert-payment", walletAddress, { payment });
}

export async function updatePreferences(walletAddress: string, preferences: Record<string, any>) {
  return callDbProxy<any>("update-preferences", walletAddress, { preferences });
}
