"use client";

import { useEffect, useState } from "react";
import { USDTAddressCelo } from "@/lib/contracts";

export interface TransferItem {
  id: string;
  kind: "deposit" | "withdrawal";
  amount: number;
  counterparty: string; // sender for a deposit, recipient for a withdrawal
  txHash: string;
  timestamp: number | null; // ms
  blockNumber: string;
}

// Celoscan is served through the Etherscan V2 multichain API (chainid 42220).
// Set NEXT_PUBLIC_CELOSCAN_API_KEY to a free Etherscan/Celoscan key.
const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";
const CELO_CHAIN_ID = 42220;

/**
 * Reads the wallet's USDT deposits (to == me) and withdrawals (from == me) from
 * the Celoscan token-transfer API. Public Celo RPCs reject eth_getLogs, so an
 * indexer API is the reliable source. Degrades to [] (bets still render) if no
 * key is configured or the request fails.
 */
export function useOnchainHistory(address?: string | null, refreshKey = 0) {
  const [items, setItems] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_CELOSCAN_API_KEY;
    if (!address || !apiKey) {
      setItems([]);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const url =
          `${ETHERSCAN_V2}?chainid=${CELO_CHAIN_ID}&module=account&action=tokentx` +
          `&contractaddress=${USDTAddressCelo}&address=${address}` +
          `&page=1&offset=50&sort=desc&apikey=${apiKey}`;

        const res = await fetch(url);
        const json = await res.json();

        // status "1" = ok with rows; "0" + "No transactions found" = empty (not an error)
        const rows: any[] = Array.isArray(json?.result) ? json.result : [];
        const me = address.toLowerCase();

        const mapped: TransferItem[] = rows.map((r) => {
          const isDeposit = String(r.to).toLowerCase() === me;
          const decimals = Number(r.tokenDecimal ?? 6);
          return {
            id: `${r.hash}:${r.to}:${r.from}`,
            kind: isDeposit ? "deposit" : "withdrawal",
            amount: Number(r.value) / Math.pow(10, decimals),
            counterparty: isDeposit ? r.from : r.to,
            txHash: r.hash,
            timestamp: r.timeStamp ? Number(r.timeStamp) * 1000 : null,
            blockNumber: String(r.blockNumber ?? ""),
          };
        });

        if (!cancelled) setItems(mapped);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, refreshKey]);

  return { transfers: items, loading };
}
