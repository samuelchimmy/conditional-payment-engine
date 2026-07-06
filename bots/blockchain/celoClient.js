import { createPublicClient, createWalletClient, http } from 'viem';
import { celo } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Native USDT on Celo mainnet
const CELO_USDT = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';

// Every transaction sent by the executor uses feeCurrency = USDT
// This is Celo CIP-64: gas is deducted in USDT, not CELO
export async function sendCeloTransaction(walletClient, txParams) {
  return walletClient.sendTransaction({
    ...txParams,
    feeCurrency: CELO_USDT,  // CIP-64: pay gas in USDT
  });
}

export function buildCeloClients(privateKeyEnvVar = 'VAULT_PRIVATE_KEY') {
  const rpcUrl = process.env.CELO_RPC_URL || 'https://forno.celo.org';
  const transport = http(rpcUrl, { retryCount: 3 });

  const publicClient = createPublicClient({ 
    chain: celo, 
    transport 
  });

  const privateKey = process.env[privateKeyEnvVar];
  let walletClient = null;

  if (privateKey) {
    const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
    walletClient = createWalletClient({
      account,
      chain: celo,
      transport,
    });
  }

  return { publicClient, walletClient };
}
