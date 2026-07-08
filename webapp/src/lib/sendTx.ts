"use client";

import { useWriteContract, useAccount, useSwitchChain } from "wagmi";
import { celo } from "wagmi/chains";
import { encodeFunctionData, type Abi } from "viem";
import { useWallet } from "@/components/WalletProvider";
import { ensureGasForWallet } from "@/lib/gasGuard";

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
  const { authMethod, wdkAccount, address } = useWallet();
  const { writeContractAsync } = useWriteContract();
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const sendTx = async ({
    address: to,
    abi,
    functionName,
    args,
    value = BigInt(0),
  }: SendTxArgs): Promise<`0x${string}`> => {
    if (authMethod === "wdk") {
      if (!wdkAccount) throw new Error("WDK wallet not initialized");

      // Gas abstraction: make sure this self-custodial wallet has CELO to pay
      // gas before it signs. Self-heals if activation is still pending.
      if (address) {
        await ensureGasForWallet(address, { waitMs: 8000 });
      }

      const data = encodeFunctionData({
        abi: abi as Abi,
        functionName,
        args: args as unknown[],
      });
      const { hash } = await wdkAccount.sendTransaction({ to, data, value });
      return hash as `0x${string}`;
    }

    // injected / walletConnect — these wallets pay their own gas, but they may
    // be connected to the wrong network. Tether Arena settles on Celo, so make
    // sure the wallet is on Celo before writing (prompts the wallet to switch).
    if (chainId !== celo.id) {
      try {
        await switchChainAsync({ chainId: celo.id });
      } catch {
        throw new Error("Please switch your wallet to the Celo network to continue.");
      }
    }

    return (await writeContractAsync({
      chainId: celo.id,
      address: to,
      abi: abi as Abi,
      functionName,
      args,
      value,
    })) as `0x${string}`;
  };

  return { sendTx };
}
