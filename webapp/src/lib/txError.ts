/**
 * Maps raw wallet/RPC errors to short, human-readable messages.
 * Normal users should never see "intrinsic transaction cost" or a revert dump.
 */
export function friendlyTxError(e: any): string {
  const raw =
    (e?.shortMessage || e?.details || e?.message || String(e || "")).toLowerCase();

  // No native CELO to pay gas. The app auto-funds new wallets, so this usually
  // means activation is still landing (or the funder needs a top-up).
  if (
    raw.includes("intrinsic transaction cost") ||
    raw.includes("insufficient funds for gas") ||
    (raw.includes("insufficient funds") && raw.includes("gas")) ||
    raw.includes("insufficient funds for intrinsic")
  ) {
    return "We're still setting up your wallet's network fees. Please wait a few seconds and try again.";
  }

  // Generic insufficient funds (token side)
  if (raw.includes("insufficient funds") || raw.includes("transfer amount exceeds balance")) {
    return "Not enough balance to complete this transaction.";
  }

  // Wrong network (external wallets)
  if (raw.includes("celo network") || raw.includes("chain mismatch") || raw.includes("wrong network") || (raw.includes("switch") && raw.includes("network"))) {
    return "Please switch your wallet to the Celo network to continue.";
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
