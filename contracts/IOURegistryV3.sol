// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable@5.1.0/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.1.0/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.1.0/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.1.0/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.1.0/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.1.0/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts@5.1.0/token/ERC20/IERC20.sol";

/**
 * @title TetherArena IOURegistryV3
 * @notice Gasless conditional escrow for social users on Celo.
 *
 * @dev Two modes of IOU:
 *
 *  STANDARD IOU (backward-compatible with V2):
 *    executeCreate()  → lock funds, send fee to treasury
 *    batchClaim()     → vault releases funds to verified claimant
 *    batchRefund()    → sender reclaims after hold duration
 *
 *  CONDITIONAL IOU (new in V3):
 *    createConditionalIOU() → lock funds with a condition hash + job ID
 *    resolveConditional()   → vault writes outcome (who won)
 *    claimConditional()     → vault pays recipient if they won
 *    refundConditional()    → sender reclaims based on resolution outcome:
 *      - If sender won (resolvedInFavor == 1)  → immediate refund
 *      - If recipient won (resolvedInFavor == 2) → 7-day lock from resolvedAt
 *      - If unresolved (resolvedInFavor == 0) + past expiry → refund (postponed match)
 *
 * @dev UUPS upgradeable proxy. Upgrade protected by onlyOwner + 48h timelock.
 *      Celo CIP-64 (feeCurrency = USDT) is handled at the transaction layer —
 *      no changes needed inside the contract itself.
 */
contract IOURegistryV3 is
    Initializable,
    ReentrancyGuardUpgradeable,
    Ownable2StepUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20Upgradeable for IERC20;

    // =========================================================================
    // Constants
    // =========================================================================

    uint256 public constant MAX_FEE_BPS   = 500;   // 5% hard cap
    uint256 public constant BPS           = 10_000;
    uint256 public constant MAX_BATCH     = 100;
    uint256 public constant RECIPIENT_WIN = 2;      // resolvedInFavor enum
    uint256 public constant SENDER_WIN    = 1;      // resolvedInFavor enum
    uint256 public constant UNRESOLVED    = 0;      // resolvedInFavor enum

    /**
     * @notice After a condition resolves in the recipient's favor, the sender
     *         must wait this long before they can request a refund. This gives
     *         the recipient time to claim before the sender can reclaim.
     */
    uint256 public constant RECIPIENT_WIN_REFUND_DELAY = 7 days;

    // =========================================================================
    // Storage
    // =========================================================================

    struct IOU {
        address sender;
        address token;
        uint256 netAmount;
        bytes32 recipientId;        // keccak256("platform:userId")
        uint64  expiry;             // fallback: refund available after this (standard + unresolved conditional)
        bool    claimed;
        bool    refunded;
        // ── Conditional fields (zero/false for standard IOUs) ─────────────
        bool    isConditional;
        bytes32 conditionHash;      // keccak256(jobId) — links to off-chain job
        uint64  resolvedAt;         // 0 = not yet resolved
        uint8   resolvedInFavor;    // 0=unresolved, 1=sender, 2=recipient
    }

    address public vault;
    address public treasury;

    uint256 public feeBps;
    uint256 public minFee;
    uint256 public holdDuration;    // Standard IOU hold before refund (default 3 days)

    uint256 public nextId;

    uint256 public executorMaxTxAmount;

    bool public globalFeeExempt;
    mapping(address => bool) public isFeeExempt;
    mapping(address => bool) public supportedTokens;
    mapping(address => bool) public executors;

    /// @notice Tracks strictly escrowed net amounts. Prevents emergencyWithdraw from touching user funds.
    mapping(address => uint256) public totalEscrowedByToken;

    mapping(uint256 => IOU)          public ious;
    mapping(bytes32 => uint256[])    public recipientIOUs;

    // ── Upgrade timelock ────────────────────────────────────────────────────
    uint256 public upgradeTimelockEnd;
    uint256 public constant UPGRADE_TIMELOCK = 48 hours;

    // =========================================================================
    // Events
    // =========================================================================

    event IOUCreated(
        uint256 indexed iouId,
        address indexed sender,
        address indexed token,
        bytes32 recipientId,
        uint256 netAmount,
        uint256 fee,
        uint64  expiry
    );
    event ConditionalIOUCreated(
        uint256 indexed iouId,
        address indexed sender,
        address indexed token,
        bytes32 recipientId,
        uint256 netAmount,
        uint256 fee,
        bytes32 conditionHash,
        bytes32 jobId
    );
    event ConditionalResolved(
        uint256 indexed iouId,
        uint8   resolvedInFavor,  // 1=sender, 2=recipient
        uint64  resolvedAt
    );
    event ConditionalClaimed(
        uint256 indexed iouId,
        bytes32 indexed recipientId,
        address indexed claimant,
        uint256 netAmount
    );
    event ConditionalRefunded(
        uint256 indexed iouId,
        address indexed sender,
        uint256 netAmount,
        uint8   resolvedInFavor   // 0=unresolved(expired), 1=sender won, 2=recipient won(7d elapsed)
    );
    event IOUClaimed(uint256 indexed iouId, bytes32 indexed recipientId, address indexed claimant, uint256 netAmount);
    event IOURefunded(uint256 indexed iouId, address indexed sender, uint256 netAmount);
    event BatchClaimed(bytes32 indexed recipientId, address indexed claimant, address indexed token, uint256 totalAmount, uint256 iouCount);
    event BatchRefunded(address indexed sender, address indexed token, uint256 totalAmount, uint256 iouCount);
    event TokenSupportUpdated(address indexed token, bool isSupported);
    event FeeExemptionUpdated(address indexed user, bool isExempt);
    event GlobalFeeExemptionUpdated(bool isExempt);
    event HoldDurationUpdated(uint256 oldDuration, uint256 newDuration);
    event UpgradeScheduled(address indexed newImplementation, uint256 timelockEnd);

    // =========================================================================
    // Errors
    // =========================================================================

    error NotVault();
    error NotExecutor();
    error AmountTooSmall();
    error AmountExceedsLimit();
    error InvalidAddress();
    error InvalidWinnerFlag();
    error MismatchedRecipient();
    error MismatchedToken();
    error InvalidBatchSize();
    error MixedSendersNotAllowed();
    error UnsupportedToken();
    error FeeExceedsMaximum();
    error InvalidDuration();
    error AmountExceedsSurplus();
    error AlreadySettled();
    error NotConditional();
    error NotSender();
    error RefundLocked(uint256 unlocksAt);
    error ConditionNotResolved();
    error ConditionWrongWinner();
    error IouAlreadyClaimed();
    error IouAlreadyRefunded();
    error UpgradeTimelockActive(uint256 unlocksAt);

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier onlyVault() {
        if (msg.sender != vault) revert NotVault();
        _;
    }

    modifier onlyExecutor() {
        if (!executors[msg.sender]) revert NotExecutor();
        _;
    }

    // =========================================================================
    // Initializer (replaces constructor for upgradeable contracts)
    // =========================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _vault,
        address _treasury,
        uint256 _feeBps,
        uint256 _minFee,
        address _initialExecutor
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);
        __Ownable2Step_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        if (_vault == address(0) || _treasury == address(0)) revert InvalidAddress();
        if (_feeBps > MAX_FEE_BPS) revert FeeExceedsMaximum();

        vault       = _vault;
        treasury    = _treasury;
        feeBps      = _feeBps;
        minFee      = _minFee;
        holdDuration = 3 days;

        if (_initialExecutor != address(0)) executors[_initialExecutor] = true;
        executors[msg.sender] = true;
    }

    // =========================================================================
    // Internal Helpers
    // =========================================================================

    function _calculateFee(address user, uint256 baseAmount) internal view returns (uint256) {
        if (globalFeeExempt || isFeeExempt[user]) return 0;
        uint256 calculated = (baseAmount * feeBps) / BPS;
        return calculated > minFee ? calculated : minFee;
    }

    function _lockFunds(
        address from,
        address token,
        uint256 netAmount
    ) internal returns (uint256 fee) {
        fee = _calculateFee(from, netAmount);
        uint256 totalRequired = netAmount + fee;

        IERC20(token).safeTransferFrom(from, address(this), totalRequired);
        if (fee > 0) IERC20(token).safeTransfer(treasury, fee);

        totalEscrowedByToken[token] += netAmount;
    }

    // =========================================================================
    // STANDARD IOU — backward compatible with V2
    // =========================================================================

    /**
     * @notice Lock tokens in escrow for a social recipient.
     *         The fee is deducted immediately; net amount sits in escrow.
     *         Recipients claim via batchClaim() after verifying social identity.
     */
    function executeCreate(
        address from,
        address token,
        uint256 netAmount,
        bytes32 recipientId
    ) external onlyExecutor nonReentrant whenNotPaused returns (uint256 iouId) {
        if (from == address(0)) revert InvalidAddress();
        if (!supportedTokens[token]) revert UnsupportedToken();
        if (netAmount == 0) revert AmountTooSmall();
        if (executorMaxTxAmount > 0 && netAmount > executorMaxTxAmount) revert AmountExceedsLimit();

        uint64 expiry = uint64(block.timestamp + holdDuration);
        uint256 fee = _lockFunds(from, token, netAmount);

        iouId = nextId++;
        ious[iouId] = IOU({
            sender: from,
            token: token,
            netAmount: netAmount,
            recipientId: recipientId,
            expiry: expiry,
            claimed: false,
            refunded: false,
            isConditional: false,
            conditionHash: bytes32(0),
            resolvedAt: 0,
            resolvedInFavor: uint8(UNRESOLVED)
        });

        recipientIOUs[recipientId].push(iouId);
        emit IOUCreated(iouId, from, token, recipientId, netAmount, fee, expiry);
    }

    /**
     * @notice Vault releases escrowed tokens to a verified claimant.
     */
    function batchClaim(
        uint256[] calldata iouIds,
        address claimant,
        bytes32 recipientId,
        address token
    ) external onlyVault nonReentrant whenNotPaused {
        if (claimant == address(0)) revert InvalidAddress();
        if (iouIds.length == 0 || iouIds.length > MAX_BATCH) revert InvalidBatchSize();

        uint256 total;
        uint256 count;

        for (uint256 i; i < iouIds.length; i++) {
            IOU storage iou = ious[iouIds[i]];
            if (iou.sender == address(0)) continue;
            if (iou.recipientId != recipientId) revert MismatchedRecipient();
            if (iou.token != token) revert MismatchedToken();
            if (iou.isConditional) continue; // conditional IOUs use claimConditional()

            if (!iou.claimed && !iou.refunded) {
                iou.claimed = true;
                total += iou.netAmount;
                count++;
                emit IOUClaimed(iouIds[i], recipientId, claimant, iou.netAmount);
            }
        }

        if (total > 0) {
            totalEscrowedByToken[token] -= total;
            IERC20(token).safeTransfer(claimant, total);
            emit BatchClaimed(recipientId, claimant, token, total, count);
        }
    }

    /**
     * @notice Sender reclaims standard IOUs after hold duration expires.
     */
    function batchRefund(
        uint256[] calldata iouIds,
        address token
    ) external nonReentrant whenNotPaused {
        if (iouIds.length == 0 || iouIds.length > MAX_BATCH) revert InvalidBatchSize();

        uint256 total;
        uint256 count;
        address targetSender;

        for (uint256 i; i < iouIds.length; i++) {
            IOU storage iou = ious[iouIds[i]];
            if (iou.sender == address(0)) continue;
            if (iou.token != token) revert MismatchedToken();
            if (iou.isConditional) continue; // conditional IOUs use refundConditional()

            if (targetSender == address(0)) {
                targetSender = iou.sender;
            } else if (iou.sender != targetSender) {
                revert MixedSendersNotAllowed();
            }

            bool authorized = (msg.sender == iou.sender || executors[msg.sender]);
            if (authorized && !iou.claimed && !iou.refunded && block.timestamp >= iou.expiry) {
                iou.refunded = true;
                total += iou.netAmount;
                count++;
                emit IOURefunded(iouIds[i], iou.sender, iou.netAmount);
            }
        }

        if (total > 0) {
            totalEscrowedByToken[token] -= total;
            IERC20(token).safeTransfer(targetSender, total);
            emit BatchRefunded(targetSender, token, total, count);
        }
    }

    // =========================================================================
    // CONDITIONAL IOU — new in V3
    // =========================================================================

    /**
     * @notice Create a conditional IOU. Funds are locked immediately.
     *         Release is gated on an off-chain condition (sport result, etc.)
     *         being verified and written by the vault via resolveConditional().
     *
     * @param from           The sender's address (must have approved this contract)
     * @param token          ERC-20 token address (must be in supportedTokens)
     * @param netAmount      Amount the recipient should receive (before fee)
     * @param recipientId    keccak256("platform:userId") — recipient identity hash
     * @param conditionHash  keccak256(jobId) — links this IOU to the off-chain job
     * @param jobId          The off-chain job identifier (stored in event for indexing)
     * @param expirySeconds  How long to hold funds before allowing expiry-refund.
     *                       Minimum 1 day, maximum 90 days. Typically set to match
     *                       date + buffer (e.g. match is in 30 days → 37 days).
     */
    function createConditionalIOU(
        address from,
        address token,
        uint256 netAmount,
        bytes32 recipientId,
        bytes32 conditionHash,
        bytes32 jobId,
        uint256 expirySeconds
    ) external onlyExecutor nonReentrant whenNotPaused returns (uint256 iouId) {
        if (from == address(0)) revert InvalidAddress();
        if (!supportedTokens[token]) revert UnsupportedToken();
        if (netAmount == 0) revert AmountTooSmall();
        if (executorMaxTxAmount > 0 && netAmount > executorMaxTxAmount) revert AmountExceedsLimit();
        if (expirySeconds < 1 days || expirySeconds > 90 days) revert InvalidDuration();

        uint64 expiry = uint64(block.timestamp + expirySeconds);
        uint256 fee = _lockFunds(from, token, netAmount);

        iouId = nextId++;
        ious[iouId] = IOU({
            sender: from,
            token: token,
            netAmount: netAmount,
            recipientId: recipientId,
            expiry: expiry,
            claimed: false,
            refunded: false,
            isConditional: true,
            conditionHash: conditionHash,
            resolvedAt: 0,
            resolvedInFavor: uint8(UNRESOLVED)
        });

        recipientIOUs[recipientId].push(iouId);
        emit ConditionalIOUCreated(iouId, from, token, recipientId, netAmount, fee, conditionHash, jobId);
    }

    /**
     * @notice Called by the vault once the off-chain oracle has verified the condition outcome.
     *         This function only writes the resolution — it does NOT transfer funds.
     *         Transfers happen in claimConditional() or refundConditional().
     *
     * @param iouId           The IOU to resolve
     * @param winnerFlag      1 = sender wins (condition not met, sender gets refund)
     *                        2 = recipient wins (condition met, recipient claims)
     */
    function resolveConditional(
        uint256 iouId,
        uint8   winnerFlag
    ) external onlyVault nonReentrant whenNotPaused {
        IOU storage iou = ious[iouId];
        if (iou.sender == address(0)) revert InvalidAddress();
        if (!iou.isConditional) revert NotConditional();
        if (iou.claimed || iou.refunded) revert AlreadySettled();
        if (iou.resolvedAt != 0) revert AlreadySettled();
        if (winnerFlag != uint8(SENDER_WIN) && winnerFlag != uint8(RECIPIENT_WIN)) revert InvalidWinnerFlag();

        iou.resolvedAt     = uint64(block.timestamp);
        iou.resolvedInFavor = winnerFlag;

        emit ConditionalResolved(iouId, winnerFlag, uint64(block.timestamp));
    }

    /**
     * @notice Transfer escrowed funds to the recipient after the condition resolves in their favor.
     *         Can be called immediately after resolveConditional() sets resolvedInFavor = 2.
     *         There is NO time restriction on the recipient claiming their winnings.
     *
     * @param iouId       The conditional IOU to claim
     * @param claimant    The recipient's wallet address (verified off-chain via OAuth)
     * @param recipientId Must match the IOU's stored recipientId
     */
    function claimConditional(
        uint256 iouId,
        address claimant,
        bytes32 recipientId
    ) external onlyVault nonReentrant whenNotPaused {
        if (claimant == address(0)) revert InvalidAddress();

        IOU storage iou = ious[iouId];
        if (iou.sender == address(0)) revert InvalidAddress();
        if (!iou.isConditional) revert NotConditional();
        if (iou.recipientId != recipientId) revert MismatchedRecipient();
        if (iou.claimed) revert IouAlreadyClaimed();
        if (iou.refunded) revert IouAlreadyRefunded();

        // Condition must have resolved in recipient's favor
        if (iou.resolvedAt == 0) revert ConditionNotResolved();
        if (iou.resolvedInFavor != uint8(RECIPIENT_WIN)) revert ConditionWrongWinner();

        iou.claimed = true;
        totalEscrowedByToken[iou.token] -= iou.netAmount;
        IERC20(iou.token).safeTransfer(claimant, iou.netAmount);

        emit ConditionalClaimed(iouId, recipientId, claimant, iou.netAmount);
    }

    /**
     * @notice Sender reclaims funds from a conditional IOU.
     *
     * Refund eligibility:
     *
     *   resolvedInFavor == 1 (SENDER_WIN):
     *     → Immediately available. Condition was not met (e.g. Nigeria lost).
     *       The sender's funds return right away.
     *
     *   resolvedInFavor == 2 (RECIPIENT_WIN):
     *     → Locked for RECIPIENT_WIN_REFUND_DELAY (7 days) from resolvedAt.
     *       This gives the recipient time to claim before the sender can reclaim.
     *       After 7 days, if the recipient has not claimed, the sender gets a refund.
     *
     *   resolvedInFavor == 0 (UNRESOLVED):
     *     → Only available after the IOU expiry timestamp.
     *       This handles: match postponed, oracle failure, dispute never resolved.
     *
     * @param iouId  The conditional IOU to refund
     */
    function refundConditional(uint256 iouId) external nonReentrant whenNotPaused {
        IOU storage iou = ious[iouId];
        if (iou.sender == address(0)) revert InvalidAddress();
        if (!iou.isConditional) revert NotConditional();
        if (iou.claimed) revert IouAlreadyClaimed();
        if (iou.refunded) revert IouAlreadyRefunded();

        // Only sender or authorized executor can refund
        if (msg.sender != iou.sender && !executors[msg.sender]) revert NotSender();

        uint8 resolution = iou.resolvedInFavor;

        if (resolution == uint8(SENDER_WIN)) {
            // Condition not met → sender wins → immediate refund ✅
            // (No time restriction)

        } else if (resolution == uint8(RECIPIENT_WIN)) {
            // Condition met → recipient won → refund locked for 7 days
            uint256 unlockTime = uint256(iou.resolvedAt) + RECIPIENT_WIN_REFUND_DELAY;
            if (block.timestamp < unlockTime) {
                revert RefundLocked(unlockTime);
            }
            // After 7 days: safety valve for unclaimed recipient funds ✅

        } else {
            // Unresolved (0) → only available after expiry (postponed match safety valve)
            if (block.timestamp < iou.expiry) {
                revert RefundLocked(iou.expiry);
            }
        }

        // Execute refund
        iou.refunded = true;
        totalEscrowedByToken[iou.token] -= iou.netAmount;
        IERC20(iou.token).safeTransfer(iou.sender, iou.netAmount);

        emit ConditionalRefunded(iouId, iou.sender, iou.netAmount, resolution);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    function getIOU(uint256 iouId) external view returns (IOU memory) {
        return ious[iouId];
    }

    function getConfig() external view returns (
        address vaultAddress,
        address treasuryAddress,
        uint256 platformFeeBps,
        uint256 minimumFee,
        uint256 maxFeeBps,
        uint256 holdTime,
        bool    isGlobalFeeExempt,
        bool    isPaused
    ) {
        return (vault, treasury, feeBps, minFee, MAX_FEE_BPS, holdDuration, globalFeeExempt, paused());
    }

    /**
     * @notice Check refund eligibility without reverting. Useful for UX pre-checks.
     * @return eligible      True if refundConditional() would succeed right now
     * @return unlocksAt     0 if eligible now, otherwise the timestamp it unlocks
     * @return reason        Human-readable reason code
     */
    function refundEligibility(uint256 iouId) external view returns (
        bool eligible,
        uint256 unlocksAt,
        string memory reason
    ) {
        IOU storage iou = ious[iouId];
        if (iou.sender == address(0)) return (false, 0, "IOU_NOT_FOUND");
        if (!iou.isConditional)       return (false, 0, "NOT_CONDITIONAL");
        if (iou.claimed)              return (false, 0, "ALREADY_CLAIMED");
        if (iou.refunded)             return (false, 0, "ALREADY_REFUNDED");

        uint8 resolution = iou.resolvedInFavor;

        if (resolution == uint8(SENDER_WIN)) {
            return (true, 0, "SENDER_WON");
        }
        if (resolution == uint8(RECIPIENT_WIN)) {
            uint256 unlock = uint256(iou.resolvedAt) + RECIPIENT_WIN_REFUND_DELAY;
            if (block.timestamp >= unlock) return (true, 0, "RECIPIENT_WIN_DELAY_ELAPSED");
            return (false, unlock, "RECIPIENT_WIN_LOCKED");
        }
        // Unresolved
        if (block.timestamp >= iou.expiry) return (true, 0, "EXPIRED_UNRESOLVED");
        return (false, iou.expiry, "NOT_YET_EXPIRED");
    }

    function getPendingIOUs(
        bytes32 recipientId,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory ids, uint256 count) {
        uint256[] storage all = recipientIOUs[recipientId];
        if (offset >= all.length || limit == 0) return (new uint256[](0), 0);

        uint256 end = offset + limit > all.length ? all.length : offset + limit;
        uint256[] memory temp = new uint256[](end - offset);
        uint256 c;

        for (uint256 i = offset; i < end; i++) {
            IOU storage iou = ious[all[i]];
            if (!iou.claimed && !iou.refunded) temp[c++] = all[i];
        }

        ids = new uint256[](c);
        for (uint256 i; i < c; i++) ids[i] = temp[i];
        count = c;
    }

    function calculateFee(address user, uint256 amount) external view returns (uint256) {
        return _calculateFee(user, amount);
    }

    // =========================================================================
    // Admin Functions
    // =========================================================================

    function setSupportedToken(address token, bool supported) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        supportedTokens[token] = supported;
        emit TokenSupportUpdated(token, supported);
    }

    function setHoldDuration(uint256 newDuration) external onlyOwner {
        if (newDuration < 1 days || newDuration > 30 days) revert InvalidDuration();
        emit HoldDurationUpdated(holdDuration, newDuration);
        holdDuration = newDuration;
    }

    function setExecutor(address executor, bool status) external onlyOwner {
        executors[executor] = status;
    }

    function setExecutorMaxTxAmount(uint256 _maxAmount) external onlyOwner {
        executorMaxTxAmount = _maxAmount;
    }

    function setFees(uint256 _feeBps, uint256 _minFee) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS) revert FeeExceedsMaximum();
        feeBps = _feeBps;
        minFee = _minFee;
    }

    function setFeeExempt(address user, bool exempt) external onlyOwner {
        isFeeExempt[user] = exempt;
        emit FeeExemptionUpdated(user, exempt);
    }

    function setGlobalFeeExempt(bool exempt) external onlyOwner {
        globalFeeExempt = exempt;
        emit GlobalFeeExemptionUpdated(exempt);
    }

    function setVault(address _vault) external onlyOwner {
        if (_vault == address(0)) revert InvalidAddress();
        vault = _vault;
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidAddress();
        treasury = _treasury;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Safely withdraw protocol surplus (fees + accidental sends).
     *         Cannot withdraw tokens actively escrowed in IOUs.
     */
    function emergencyWithdrawToken(address token, uint256 amount) external onlyOwner {
        uint256 balance  = IERC20(token).balanceOf(address(this));
        uint256 escrowed = totalEscrowedByToken[token];
        if (balance < escrowed) revert AmountExceedsSurplus();
        uint256 surplus = balance - escrowed;
        if (amount > surplus) revert AmountExceedsSurplus();
        IERC20(token).safeTransfer(owner(), amount);
    }

    // =========================================================================
    // UUPS Upgrade — with 48h timelock
    // =========================================================================

    /**
     * @notice Schedule an upgrade. The actual upgrade can only happen 48h after this call.
     *         This gives users time to exit if they disagree with the upgrade.
     */
    function scheduleUpgrade(address newImplementation) external onlyOwner {
        upgradeTimelockEnd = block.timestamp + UPGRADE_TIMELOCK;
        emit UpgradeScheduled(newImplementation, upgradeTimelockEnd);
    }

    /**
     * @dev Required by UUPS. Upgrade is only allowed after the 48h timelock.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        if (upgradeTimelockEnd == 0 || block.timestamp < upgradeTimelockEnd) {
            revert UpgradeTimelockActive(upgradeTimelockEnd);
        }
        // Reset after use — next upgrade needs a fresh scheduleUpgrade() call
        upgradeTimelockEnd = 0;
    }
}
