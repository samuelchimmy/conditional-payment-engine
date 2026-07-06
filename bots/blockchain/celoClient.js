import { createPublicClient, createWalletClient, http } from 'viem';
import { celo } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Native USDT on Celo mainnet
const CELO_USDT = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';

// ============ Nonce Manager (Mutex pattern) ============

class Mutex {
  constructor() { this.queue = Promise.resolve(); }
  async run(fn) {
    const result = this.queue.then(fn);
    this.queue = result.catch(() => {});
    return result;
  }
}

const _chainMutexes = {};
const _chainNonces  = {};

function _getMutex(chainKey) {
  if (!_chainMutexes[chainKey]) _chainMutexes[chainKey] = new Mutex();
  return _chainMutexes[chainKey];
}

export async function sendTransactionWithNonce(walletClient, publicClient, txParams) {
  const chainKey = 'celo';
  return _getMutex(chainKey).run(async () => {
    const address = walletClient.account.address;
    if (_chainNonces[chainKey] == null) {
      console.log(`[NonceManager] Fetching pending nonce for ${address} on ${chainKey}`);
      _chainNonces[chainKey] = await publicClient.getTransactionCount({
        address,
        blockTag: 'pending',
      });
    }
    const nonce = _chainNonces[chainKey];
    console.log(`[NonceManager] Sending tx on ${chainKey} with nonce ${nonce}`);
    try {
      const hash = await walletClient.sendTransaction({ 
        ...txParams, 
        nonce,
        feeCurrency: CELO_USDT 
      });
      _chainNonces[chainKey]++;
      return hash;
    } catch (err) {
      console.warn(`[NonceManager] Tx failed on ${chainKey}, clearing cached nonce. Error: ${err.message?.split('\n')[0]}`);
      _chainNonces[chainKey] = null;
      throw err;
    }
  });
}

// Every transaction sent by the executor uses feeCurrency = USDT
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
