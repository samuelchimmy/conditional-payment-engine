import { keccak256, encodePacked, encodeFunctionData, parseUnits, decodeEventLog, erc20Abi } from 'viem';
import { buildCeloClients, sendCeloTransaction, sendTransactionWithNonce } from './celoClient.js';

export const IOU_REGISTRY_V3_ABI = [
  { type: 'function', name: 'createConditionalIOU', stateMutability: 'nonpayable', inputs: [{ name: 'sender', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'recipientId', type: 'bytes32' }, { name: 'conditionHash', type: 'bytes32' }], outputs: [{ name: 'iouId', type: 'uint256' }] },
  { type: 'function', name: 'resolveConditional', stateMutability: 'nonpayable', inputs: [{ name: 'iouId', type: 'uint256' }, { name: 'resolvedInFavor', type: 'uint8' }], outputs: [] },
  { type: 'function', name: 'claimConditional', stateMutability: 'nonpayable', inputs: [{ name: 'iouId', type: 'uint256' }, { name: 'recipientAddress', type: 'address' }, { name: 'recipientId', type: 'bytes32' }], outputs: [] },
  { type: 'event', name: 'ConditionalIOUCreated', inputs: [
    { name: 'iouId', type: 'uint256', indexed: true },
    { name: 'sender', type: 'address', indexed: true },
    { name: 'recipientId', type: 'bytes32', indexed: true },
    { name: 'grossAmount', type: 'uint256', indexed: false },
    { name: 'conditionHash', type: 'bytes32', indexed: false },
  ], anonymous: false },
];

const CELO_USDT = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';

export function getRecipientId(platform, userId) {
  return keccak256(encodePacked(['string', 'string', 'string'], [platform, ':', userId]));
}

export async function createConditionalIOU({ senderAddress, amount, recipientId, conditionHash, jobId }) {
  const { publicClient, walletClient } = buildCeloClients('EXECUTOR_PRIVATE_KEY');
  const registry = process.env.IOU_REGISTRY_V3;

  if (!registry) throw new Error('IOU_REGISTRY_V3 address missing');
  if (!walletClient) throw new Error('EXECUTOR_PRIVATE_KEY missing');

  const amountUnits = parseUnits(amount.toString(), 6);

  const allowance = await publicClient.readContract({
    address: CELO_USDT,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [senderAddress, registry],
  });

  if (allowance < amountUnits) {
    throw new Error(`ERROR_INSUFFICIENT_ALLOWANCE`);
  }

  const balance = await publicClient.readContract({
    address: CELO_USDT,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [senderAddress],
  });

  if (balance < amountUnits) {
    throw new Error(`ERROR_INSUFFICIENT_BALANCE`);
  }

  const data = encodeFunctionData({
    abi: IOU_REGISTRY_V3_ABI,
    functionName: 'createConditionalIOU',
    args: [senderAddress, amountUnits, recipientId, conditionHash],
  });

  let gas;
  try {
    gas = await publicClient.estimateGas({ account: walletClient.account, to: registry, data });
  } catch (e) {
    throw new Error(`Gas estimation failed: ${e.message}`);
  }

  // Use Mutex sendTransactionWithNonce
  const hash = await sendTransactionWithNonce(walletClient, publicClient, {
    account: walletClient.account,
    to: registry,
    data,
    gas: gas + (gas / 5n),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status === 'reverted') {
    throw new Error(`On-chain create reverted (${hash})`);
  }

  let iouId = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== registry.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({ abi: IOU_REGISTRY_V3_ABI, data: log.data, topics: log.topics });
      if (decoded.eventName === 'ConditionalIOUCreated') {
        iouId = decoded.args.iouId.toString();
        break;
      }
    } catch (_) { }
  }

  return { iouId, txHash: hash };
}

export async function resolveConditional(iouId, resolvedInFavor) {
  const { publicClient, walletClient } = buildCeloClients('VAULT_PRIVATE_KEY');
  const registry = process.env.IOU_REGISTRY_V3;

  const data = encodeFunctionData({
    abi: IOU_REGISTRY_V3_ABI,
    functionName: 'resolveConditional',
    args: [BigInt(iouId), resolvedInFavor],
  });

  let gas = await publicClient.estimateGas({ account: walletClient.account, to: registry, data });
  const hash = await sendTransactionWithNonce(walletClient, publicClient, {
    account: walletClient.account,
    to: registry,
    data,
    gas: gas + (gas / 5n),
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function claimConditional(iouId, recipientAddress, recipientId) {
  const { publicClient, walletClient } = buildCeloClients('VAULT_PRIVATE_KEY');
  const registry = process.env.IOU_REGISTRY_V3;

  const data = encodeFunctionData({
    abi: IOU_REGISTRY_V3_ABI,
    functionName: 'claimConditional',
    args: [BigInt(iouId), recipientAddress, recipientId],
  });

  let gas = await publicClient.estimateGas({ account: walletClient.account, to: registry, data });
  const hash = await sendTransactionWithNonce(walletClient, publicClient, {
    account: walletClient.account,
    to: registry,
    data,
    gas: gas + (gas / 5n),
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
