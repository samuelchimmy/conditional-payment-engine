export const IOURegistryV3Address = "0x4708f9697c72bBBCa2ad82bbf03F2A8E0d62038C";
export const USDTAddressCelo = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";

export const ERC20ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "Transfer",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

export const IOURegistryV3ABI = [
  {
    name: "initialize",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_vault", type: "address" },
      { name: "_treasury", type: "address" },
      { name: "_feeBps", type: "uint256" },
      { name: "_minFee", type: "uint256" },
      { name: "_initialExecutor", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "lockFunds",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "conditionId", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "createCondition",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "conditionId", type: "bytes32" },
      { name: "query", type: "string" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "counterparty", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "claimFunds",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "conditionId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "refundFunds",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "conditionId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "executeCondition",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "conditionId", type: "bytes32" },
      { name: "winner", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "getCondition",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "conditionId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "query", type: "string" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "sender", type: "address" },
          { name: "counterparty", type: "address" },
          { name: "winner", type: "address" },
          { name: "state", type: "uint8" },
          { name: "lockedAt", type: "uint256" },
          { name: "resolvedAt", type: "uint256" },
        ],
      },
    ],
  },
] as const;
