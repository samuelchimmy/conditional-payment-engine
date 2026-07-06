export const IOURegistryV3Address = "0x4708f9697c72bBBCa2ad82bbf03F2A8E0d62038C";
export const USDTAddressCelo = "0x48065fbBE25f71C9282ddf5e1cD6D6A882427259";

export const IOURegistryV3ABI = [
  "function initialize(address _vault, address _treasury, uint256 _feeBps, uint256 _minFee, address _initialExecutor)",
  "function owner() view returns (address)",
  "function lockFunds(bytes32 conditionId, address token, uint256 amount)",
  "function createCondition(bytes32 conditionId, string memory query, address token, uint256 amount, address counterparty) payable",
  "function claimFunds(bytes32 conditionId)",
  "function refundFunds(bytes32 conditionId)",
  "function executeCondition(bytes32 conditionId, address winner)",
  "function getCondition(bytes32 conditionId) view returns (tuple(string query, address token, uint256 amount, address sender, address counterparty, address winner, uint8 state, uint256 lockedAt, uint256 resolvedAt))"
];

export const ERC20ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];
