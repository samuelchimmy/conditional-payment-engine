"use client";

import { useWriteContract } from "wagmi";
import { encodeFunctionData, type Abi } from "viem";
import { useWallet } from "@/components/WalletProvider";

export interface SendTxArgs {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args: readonly unknown[];
  value?: bigint;
}

/**
 * Unified on-chain write. Branches on wallet mode:
 *  - metamask / walletconnect → wagmi writeContractAsync
 *  - wdk (self-custodial)     → encode calldata + WalletAccountEvm.sendTransaction
 *
 * Returns the tx hash in both cases (feed it to useWaitForTransactionReceipt).
 *
 * NOTE: WDK txs pay gas in native CELO (the installed @tetherto/wdk-wallet-evm
 * beta has no CIP-64 feeCurrency support) — the WDK account must hold a little
 * CELO for gas, or the broadcast reverts. MetaMask users are unaffected.
 *
 * 'google' is a mock mode with no signer — callers keep their own simulated path.
 */
export function useSendTx() {
  const { authMethod, wdkAccount } = useWallet();
  const { writeContractAsync } = useWriteContract();

  const sendTx = async ({
    address,
    abi,
    functionName,
    args,
    value = BigInt(0),
  }: SendTxArgs): Promise<`0x${string}`> => {
    if (authMethod === "wdk") {
      if (!wdkAccount) throw new Error("WDK wallet not initialized");
      const data = encodeFunctionData({
        abi: abi as Abi,
        functionName,
        args: args as unknown[],
      });
      const { hash } = await wdkAccount.sendTransaction({ to: address, data, value });
      return hash as `0x${string}`;
    }

    // injected / walletConnect
    return (await writeContractAsync({
      address,
      abi: abi as Abi,
      functionName,
      args,
      value,
    })) as `0x${string}`;
  };

  return { sendTx };
}
