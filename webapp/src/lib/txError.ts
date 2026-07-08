/**
 * Maps raw wallet/RPC errors to short, human-readable messages.
 * Normal users should never see "intrinsic transaction cost" or a revert dump.
 */
export function friendlyTxError(e: any): string {
  const raw =
    (e?.shortMessage || e?.details || e?.message || String(e || "")).toLowerCase();

  // No native CELO to pay gas (WDK wallets pay gas in CELO, not USDT)
  if (
    raw.includes("intrinsic transaction cost") ||
    raw.includes("insufficient funds for gas") ||
    (raw.includes("insufficient funds") && raw.includes("gas")) ||
    raw.includes("insufficient funds for intrinsic")
  ) {
    return "You need a small amount of CELO to cover the network fee. Add a little CELO to your wallet and try again.";
  }

  // Generic insufficient funds (token side)
  if (raw.includes("insufficient funds") || raw.includes("transfer amount exceeds balance")) {
    return "Not enough balance to complete this transaction.";
  }

  // User rejected in an injected wallet
  if (raw.includes("user rejected") || raw.includes("user denied") || raw.includes("rejected the request")) {
    return "Transaction cancelled.";
  }

  // Allowance / approval issues
  if (raw.includes("insufficient allowance") || raw.includes("allowance")) {
    return "You need to approve spending first before this transaction.";
  }

  // Network / RPC hiccups
  if (raw.includes("timeout") || raw.includes("network") || raw.includes("fetch failed")) {
    return "Network issue reaching Celo. Please try again in a moment.";
  }

  // Fallback — short and non-scary
  return "Something went wrong with the transaction. Please try again.";
}
