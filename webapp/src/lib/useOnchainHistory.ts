"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { celo } from "wagmi/chains";
import { parseAbiItem, formatUnits } from "viem";
import { USDTAddressCelo } from "@/lib/contracts";

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

export interface TransferItem {
  id: string;
  kind: "deposit" | "withdrawal";
  amount: number;
  counterparty: string; // sender for a deposit, recipient for a withdrawal
  txHash: string;
  timestamp: number | null; // ms
  blockNumber: string;
}

/**
 * Reads the user's on-chain USDT deposits (Transfer.to == me) and withdrawals
 * (Transfer.from == me) over a bounded recent window. Client-side and
 * self-contained; degrades to [] on RPC limits so bets still render.
 */
export function useOnchainHistory(address?: string | null, refreshKey = 0) {
  const publicClient = usePublicClient({ chainId: celo.id });
  const [items, setItems] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient) {
      setItems([]);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const latest = await publicClient.getBlockNumber();
        // ~last few days of Celo (~5s blocks). Bounded to keep RPC happy.
        const LOOKBACK = BigInt(50_000);
        const fromBlock = latest > LOOKBACK ? latest - LOOKBACK : BigInt(0);

        const [incoming, outgoing] = await Promise.all([
          publicClient
            .getLogs({ address: USDTAddressCelo, event: TRANSFER_EVENT, args: { to: address as `0x${string}` }, fromBlock, toBlock: latest })
            .catch(() => []),
          publicClient
            .getLogs({ address: USDTAddressCelo, event: TRANSFER_EVENT, args: { from: address as `0x${string}` }, fromBlock, toBlock: latest })
            .catch(() => []),
        ]);

        const raw = [
          ...incoming.map((l: any) => ({ l, kind: "deposit" as const })),
          ...outgoing.map((l: any) => ({ l, kind: "withdrawal" as const })),
        ]
          // newest first, cap to keep timestamp lookups cheap
          .sort((a, b) => Number(b.l.blockNumber - a.l.blockNumber))
          .slice(0, 30);

        // Batch-fetch timestamps for the unique blocks we actually show.
        const uniqueBlocks = Array.from(new Set(raw.map((r) => r.l.blockNumber)));
        const blockTimes = new Map<bigint, number>();
        await Promise.all(
          uniqueBlocks.map(async (bn) => {
            try {
              const b = await publicClient.getBlock({ blockNumber: bn });
              blockTimes.set(bn, Number(b.timestamp) * 1000);
            } catch {
              /* leave undefined */
            }
          })
        );

        const mapped: TransferItem[] = raw.map(({ l, kind }) => ({
          id: `${l.transactionHash}:${l.logIndex}`,
          kind,
          amount: Number(formatUnits(l.args.value as bigint, 6)),
          counterparty: (kind === "deposit" ? l.args.from : l.args.to) as string,
          txHash: l.transactionHash as string,
          timestamp: blockTimes.get(l.blockNumber) ?? null,
          blockNumber: l.blockNumber.toString(),
        }));

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
  }, [address, publicClient, refreshKey]);

  return { transfers: items, loading };
}
