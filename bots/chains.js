/**
 * bots/chains.js
 * Chain configuration registry for all supported networks.
 * Referenced by discord-iou.js and other multi-chain bot files.
 */

import { celo, base, bsc } from 'viem/chains';

export const CHAIN_CONFIGS = {
  celo: {
    chain: celo,
    rpcs: [
      process.env.CELO_RPC_URL || 'https://forno.celo.org',
      'https://celo-mainnet.g.alchemy.com/v2/demo',
    ],
    tokenAddress: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e', // USDT on Celo
    magicPayAddress: process.env.MAGIC_PAY_CELO || process.env.IOU_REGISTRY_V3 || null,
    symbol: 'USDT',
    decimals: 6,
    feeCurrency: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e', // CIP-64: pay gas in USDT
  },
  base: {
    chain: base,
    rpcs: [
      process.env.BASE_RPC_URL || 'https://base-rpc.publicnode.com',
    ],
    tokenAddress: process.env.BASE_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    magicPayAddress: process.env.MAGIC_PAY_BASE || null,
    symbol: 'USDC',
    decimals: 6,
    feeCurrency: null,
  },
  bsc: {
    chain: bsc,
    rpcs: [
      process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    ],
    tokenAddress: process.env.BSC_USDT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC
    magicPayAddress: process.env.MAGIC_PAY_BSC || null,
    symbol: 'USDT',
    decimals: 18,
    feeCurrency: null,
  },
};

/**
 * Get chain config by name.
 * @param {string} chainName
 * @returns {object}
 */
export function getChainConfig(chainName) {
  const cfg = CHAIN_CONFIGS[chainName?.toLowerCase()];
  if (!cfg) throw new Error(`Unsupported chain: ${chainName}. Supported: ${Object.keys(CHAIN_CONFIGS).join(', ')}`);
  return cfg;
}

export function isTestnet(chainName) {
  // Add testnet chain names here when supporting them
  return ['celoAlfajores', 'baseSepolia', 'bscTestnet'].includes(chainName);
}

export const SUPPORTED_CHAINS = Object.keys(CHAIN_CONFIGS);
