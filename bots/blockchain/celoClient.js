import { createPublicClient, createWalletClient, http } from 'viem';
import { celo } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Native USDT on Celo mainnet (the ERC-20 token — used for balances/transfers).
const CELO_USDT = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';

// CIP-64 fee-currency ADAPTER for USDT (6→18 decimal adapter). This — NOT the
// token address — is what you pass in `feeCurrency`. Passing the token address
// makes the transaction fail. Governed by the Celo FeeCurrencyDirectory.
const USDT_FEE_CURRENCY = '0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72';

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
  const address = walletClient.account.address;
  // H-4: key by account, not just chain. The executor and vault are different
  // wallets on Celo; a shared 'celo' key made them collide on nonces.
  const chainKey = `celo:${address.toLowerCase()}`;
  return _getMutex(chainKey).run(async () => {
    if (_chainNonces[chainKey] == null) {
      console.log(`[NonceManager] Fetching pending nonce for ${address}`);
      _chainNonces[chainKey] = await publicClient.getTransactionCount({
        address,
        blockTag: 'pending',
      });
    }
    const nonce = _chainNonces[chainKey];
    console.log(`[NonceManager] Sending tx for ${address} with nonce ${nonce}`);
    try {
      const hash = await walletClient.sendTransaction({
        ...txParams,
        nonce,
        feeCurrency: USDT_FEE_CURRENCY
      });
      _chainNonces[chainKey]++;
      return hash;
    } catch (err) {
      console.warn(`[NonceManager] Tx failed for ${address}, clearing cached nonce. Error: ${err.message?.split('\n')[0]}`);
      _chainNonces[chainKey] = null;
      throw err;
    }
  });
}

// Every transaction sent by the executor uses feeCurrency = USDT
export async function sendCeloTransaction(walletClient, txParams) {
  return walletClient.sendTransaction({
    ...txParams,
    feeCurrency: USDT_FEE_CURRENCY,  // CIP-64: pay gas in USDT (via 6→18 adapter)
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
