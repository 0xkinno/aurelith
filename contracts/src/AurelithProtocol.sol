// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IFdcVerification} from "@flarenetwork/flare-periphery-contracts/coston2/IFdcVerification.sol";
import {IEVMTransaction} from "@flarenetwork/flare-periphery-contracts/coston2/IEVMTransaction.sol";
import {IActiveTeeSet} from "./interfaces/IActiveTeeSet.sol";
import {IAurelithFccInstructionSender} from "./interfaces/IAurelithFccInstructionSender.sol";

contract AurelithProtocol is ReentrancyGuard {
    uint16 public constant BPS_DENOMINATOR = 10_000;
    uint16 public constant MAX_PARTICIPANTS = 32;
    string public constant VERSION = "1.0.0";

    enum Status {
        NONE,
        DRAFT,
        FUNDED,
        PROOF_REQUESTED,
        PROOF_VERIFIED,
        COMPUTATION_REQUESTED,
        RESULT_AUTHENTICATED,
        READY_TO_SETTLE,
        SETTLED,
        CANCELLED,
        REFUNDED
    }

    struct Policy {
        address owner;
        uint64 createdAt;
        uint64 expiry;
        uint64 proofRequestedAt;
        uint64 proofVerifiedAt;
        uint64 resultAuthenticatedAt;
        uint64 settledAt;
        uint64 resultNonce;
        uint128 targetAmount;
        uint128 fundedAmount;
        uint128 settledAmount;
        bytes32 ruleHash;
        bytes32 paymentReferenceHash;
        bytes32 participantHash;
        bytes32 externalProofDigest;
        bytes32 sourceTransactionHash;
        bytes32 privateInputHash;
        bytes32 resultDigest;
        bytes32 computationReference;
        Status status;
    }

    struct CreatePolicyParams {
        bytes32 salt;
        bytes32 ruleHash;
        bytes32 paymentReferenceHash;
        uint128 targetAmount;
        uint64 expiry;
        address[] recipients;
        uint16[] sharesBps;
    }

    struct SettlementResult {
        bytes32 policyId;
        bytes32 externalProofDigest;
        bytes32 privateInputHash;
        bytes32 computationReference;
        address[] recipients;
        uint256[] amounts;
        uint256 total;
        uint64 nonce;
        uint64 expiry;
    }

    IFdcVerification public immutable fdcVerification;
    address public resultAuthorizer;
    address public pendingResultAuthorizer;
    IActiveTeeSet public activeTeeRegistry;
    uint256 public teeExtensionId;
    bool public teeRegistryConfigured;
    IAurelithFccInstructionSender public fccInstructionSender;

    mapping(bytes32 => Policy) private policies;
    mapping(bytes32 => address[]) private policyRecipients;
    mapping(bytes32 => uint16[]) private policyShares;
    mapping(bytes32 => bool) public usedProofDigests;
    mapping(bytes32 => bool) public usedResultDigests;
    mapping(address => uint256) public ownerNonces;

    error Unauthorized();
    error InvalidAddress();
    error InvalidState(Status expected, Status actual);
    error InvalidExpiry();
    error InvalidParticipants();
    error InvalidShares();
    error DuplicateRecipient();
    error InvalidAmount();
    error PolicyExists();
    error PolicyMissing();
    error PolicyExpired();
    error ProofInvalid();
    error ProofReplayed();
    error ResultReplayed();
    error ResultMismatch();
    error NonceMismatch();
    error TransferFailed(address recipient, uint256 amount);
    error CancellationUnavailable();
    error InvalidActionResultSignature();
    error InvalidActionResultStatus();
    error TeeRegistryUnavailable();

    event PolicyCreated(
        bytes32 indexed policyId,
        address indexed owner,
        bytes32 indexed paymentReferenceHash,
        bytes32 ruleHash,
        bytes32 participantHash,
        uint256 targetAmount,
        uint256 expiry,
        address[] recipients,
        uint16[] sharesBps
    );
    event PolicyFunded(bytes32 indexed policyId, address indexed funder, uint256 amount, uint256 totalFunded);
    event ProofRequested(bytes32 indexed policyId, bytes32 indexed requestReference, uint256 timestamp);
    event ProofVerified(bytes32 indexed policyId, bytes32 indexed proofDigest, bytes32 indexed sourceTransactionHash, uint256 sourceBlock, uint256 sourceTimestamp);
    event ComputationRequested(bytes32 indexed policyId, bytes32 indexed computationReference, bytes32 privateInputHash, uint64 nonce, uint256 timestamp);
    event ResultAuthenticated(bytes32 indexed policyId, bytes32 indexed resultDigest, bytes32 indexed computationReference, uint64 nonce, uint256 total, uint256 expiry);
    event PolicyReady(bytes32 indexed policyId, uint256 timestamp);
    event SettlementExecuted(bytes32 indexed policyId, bytes32 indexed resultDigest, uint64 nonce, uint256 total, address[] recipients, uint256[] amounts);
    event PolicyCancelled(bytes32 indexed policyId, uint256 refundableAmount, uint256 timestamp);
    event PolicyRefunded(bytes32 indexed policyId, address indexed owner, uint256 amount, uint256 timestamp);
    event ResultAuthorizerTransferStarted(address indexed currentAuthorizer, address indexed pendingAuthorizer);
    event ResultAuthorizerTransferred(address indexed previousAuthorizer, address indexed newAuthorizer);
    event ActionResultAccepted(bytes32 indexed policyId, bytes32 indexed actionId, bytes32 indexed actionResultHash, uint8 status);
    event TeeRegistryConfigured(address indexed registry, uint256 indexed extensionId);
    event InstructionSenderConfigured(address indexed instructionSender, uint256 indexed extensionId);

    constructor(address fdcVerification_, address resultAuthorizer_) {
        if (fdcVerification_ == address(0) || resultAuthorizer_ == address(0)) revert InvalidAddress();
        fdcVerification = IFdcVerification(fdcVerification_);
        resultAuthorizer = resultAuthorizer_;
    }

    modifier onlyPolicyOwner(bytes32 policyId) {
        Policy storage policy = policies[policyId];
        if (policy.owner == address(0)) revert PolicyMissing();
        if (policy.owner != msg.sender) revert Unauthorized();
        _;
    }

    function createPolicy(CreatePolicyParams calldata params) external returns (bytes32 policyId) {
        _validateParticipants(params.recipients, params.sharesBps);
        if (params.ruleHash == bytes32(0) || params.paymentReferenceHash == bytes32(0)) revert ResultMismatch();
        if (params.targetAmount == 0) revert InvalidAmount();
        if (params.expiry <= block.timestamp) revert InvalidExpiry();

        uint256 ownerNonce = ownerNonces[msg.sender]++;
        bytes32 participantHash = keccak256(abi.encode(params.recipients, params.sharesBps));
        policyId = keccak256(
            abi.encode(
                "AURELITH_POLICY_V1",
                block.chainid,
                msg.sender,
                ownerNonce,
                params.salt,
                params.ruleHash,
                params.paymentReferenceHash,
                participantHash,
                params.targetAmount,
                params.expiry
            )
        );
        if (policies[policyId].owner != address(0)) revert PolicyExists();

        policies[policyId] = Policy({
            owner: msg.sender,
            createdAt: uint64(block.timestamp),
            expiry: params.expiry,
            proofRequestedAt: 0,
            proofVerifiedAt: 0,
            resultAuthenticatedAt: 0,
            settledAt: 0,
            resultNonce: 0,
            targetAmount: params.targetAmount,
            fundedAmount: 0,
            settledAmount: 0,
            ruleHash: params.ruleHash,
            paymentReferenceHash: params.paymentReferenceHash,
            participantHash: participantHash,
            externalProofDigest: bytes32(0),
            sourceTransactionHash: bytes32(0),
            privateInputHash: bytes32(0),
            resultDigest: bytes32(0),
            computationReference: bytes32(0),
            status: Status.DRAFT
        });
        policyRecipients[policyId] = params.recipients;
        policyShares[policyId] = params.sharesBps;

        emit PolicyCreated(policyId, msg.sender, params.paymentReferenceHash, params.ruleHash, participantHash, params.targetAmount, params.expiry, params.recipients, params.sharesBps);
    }

    function fundPolicy(bytes32 policyId) external payable nonReentrant {
        Policy storage policy = policies[policyId];
        if (policy.owner == address(0)) revert PolicyMissing();
        if (policy.status != Status.DRAFT && policy.status != Status.FUNDED) revert InvalidState(Status.DRAFT, policy.status);
        if (block.timestamp >= policy.expiry) revert PolicyExpired();
        if (msg.value == 0 || uint256(policy.fundedAmount) + msg.value > policy.targetAmount) revert InvalidAmount();
        policy.fundedAmount += uint128(msg.value);
        if (policy.fundedAmount == policy.targetAmount) policy.status = Status.FUNDED;
        emit PolicyFunded(policyId, msg.sender, msg.value, policy.fundedAmount);
    }

    function requestProof(bytes32 policyId, bytes32 requestReference) external onlyPolicyOwner(policyId) {
        Policy storage policy = policies[policyId];
        _requireState(policy, Status.FUNDED);
        _requireNotExpired(policy);
        if (requestReference == bytes32(0)) revert ResultMismatch();
        policy.status = Status.PROOF_REQUESTED;
        policy.proofRequestedAt = uint64(block.timestamp);
        emit ProofRequested(policyId, requestReference, block.timestamp);
    }

    function submitEvmProof(bytes32 policyId, IEVMTransaction.Proof calldata proof) external onlyPolicyOwner(policyId) {
        Policy storage policy = policies[policyId];
        _requireState(policy, Status.PROOF_REQUESTED);
        _requireNotExpired(policy);
        if (!fdcVerification.verifyEVMTransaction(proof)) revert ProofInvalid();

        bytes32 proofDigest = keccak256(abi.encode(proof.data));
        if (usedProofDigests[proofDigest]) revert ProofReplayed();
        if (proof.data.requestBody.transactionHash == bytes32(0) || proof.data.responseBody.status != 1) revert ProofInvalid();
        if (proof.data.responseBody.value < policy.targetAmount) revert InvalidAmount();

        usedProofDigests[proofDigest] = true;
        policy.externalProofDigest = proofDigest;
        policy.sourceTransactionHash = proof.data.requestBody.transactionHash;
        policy.proofVerifiedAt = uint64(block.timestamp);
        policy.status = Status.PROOF_VERIFIED;
        emit ProofVerified(policyId, proofDigest, proof.data.requestBody.transactionHash, proof.data.responseBody.blockNumber, proof.data.responseBody.timestamp);
    }

    function sendComputationInstruction(bytes32 policyId, bytes32 privateInputHash, bytes calldata message) external payable onlyPolicyOwner(policyId) returns (bytes32 instructionId) {
        Policy storage policy = policies[policyId];
        _requireState(policy, Status.PROOF_VERIFIED);
        _requireNotExpired(policy);
        if (address(fccInstructionSender) == address(0) || fccInstructionSender.extensionId() == 0 || privateInputHash == bytes32(0) || message.length == 0) revert ResultMismatch();
        instructionId = fccInstructionSender.sendSettlementInstruction{value: msg.value}(policyId, message, msg.sender);
        policy.privateInputHash = privateInputHash;
        policy.computationReference = instructionId;
        policy.resultNonce += 1;
        policy.status = Status.COMPUTATION_REQUESTED;
        emit ComputationRequested(policyId, instructionId, policy.privateInputHash, policy.resultNonce, block.timestamp);
    }

    /// @notice Authenticates an FCC ActionResult using Flare's canonical signing
    /// preimage. The signer configured as resultAuthorizer is the active TEE key
    /// for the registered extension; the browser can never authorize payout data.
    function authenticateActionResult(
        SettlementResult calldata result,
        bytes32 actionId,
        string calldata submissionTag,
        uint8 actionStatus,
        bytes calldata signature
    ) external {
        if (!teeRegistryConfigured) revert TeeRegistryUnavailable();
        if (actionStatus != 1) revert InvalidActionResultStatus();
        if (actionId != result.computationReference) revert ResultMismatch();
        bytes32 resultHash = keccak256(
            abi.encodePacked(
                keccak256(abi.encode(result)),
                actionId,
                keccak256(bytes(submissionTag)),
                actionStatus
            )
        );
        bytes32 payloadHash = keccak256(abi.encode(bytes32("TEE_ACTION_RESULT"), block.chainid, resultHash));
        address signer = _recover(_ethSigned(payloadHash), signature);
        if (!_isAuthorizedTee(signer)) revert InvalidActionResultSignature();
        _authenticateResult(result);
        emit ActionResultAccepted(result.policyId, actionId, resultHash, actionStatus);
    }

    function _authenticateResult(SettlementResult calldata result) internal {
        Policy storage policy = policies[result.policyId];
        if (policy.owner == address(0)) revert PolicyMissing();
        _requireState(policy, Status.COMPUTATION_REQUESTED);
        _requireNotExpired(policy);
        if (result.expiry > policy.expiry || result.expiry <= block.timestamp) revert InvalidExpiry();
        if (result.nonce != policy.resultNonce) revert NonceMismatch();
        if (result.externalProofDigest != policy.externalProofDigest || result.privateInputHash != policy.privateInputHash || result.computationReference != policy.computationReference) revert ResultMismatch();
        if (keccak256(abi.encode(result.recipients, policyShares[result.policyId])) != policy.participantHash) revert ResultMismatch();
        if (result.recipients.length != result.amounts.length || result.recipients.length == 0) revert InvalidParticipants();
        if (result.total != policy.targetAmount || result.total != policy.fundedAmount) revert InvalidAmount();

        uint256 sum;
        for (uint256 i; i < result.amounts.length; ++i) {
            if (result.recipients[i] != policyRecipients[result.policyId][i] || result.amounts[i] == 0) revert ResultMismatch();
            sum += result.amounts[i];
        }
        if (sum != result.total) revert InvalidAmount();

        bytes32 resultDigest = hashSettlementResult(result);
        if (usedResultDigests[resultDigest]) revert ResultReplayed();
        usedResultDigests[resultDigest] = true;
        policy.resultDigest = resultDigest;
        policy.resultAuthenticatedAt = uint64(block.timestamp);
        policy.status = Status.RESULT_AUTHENTICATED;
        emit ResultAuthenticated(result.policyId, resultDigest, result.computationReference, result.nonce, result.total, result.expiry);
        policy.status = Status.READY_TO_SETTLE;
        emit PolicyReady(result.policyId, block.timestamp);
    }

    function settle(SettlementResult calldata result) external nonReentrant onlyPolicyOwner(result.policyId) {
        Policy storage policy = policies[result.policyId];
        _requireState(policy, Status.READY_TO_SETTLE);
        _requireNotExpired(policy);
        bytes32 digest = hashSettlementResult(result);
        if (digest != policy.resultDigest) revert ResultMismatch();

        policy.status = Status.SETTLED;
        policy.settledAt = uint64(block.timestamp);
        policy.settledAmount = uint128(result.total);
        policy.fundedAmount = 0;

        for (uint256 i; i < result.recipients.length; ++i) {
            (bool success,) = payable(result.recipients[i]).call{value: result.amounts[i]}("");
            if (!success) revert TransferFailed(result.recipients[i], result.amounts[i]);
        }
        emit SettlementExecuted(result.policyId, digest, result.nonce, result.total, result.recipients, result.amounts);
    }

    function cancelPolicy(bytes32 policyId) external onlyPolicyOwner(policyId) {
        Policy storage policy = policies[policyId];
        if (policy.status != Status.DRAFT && policy.status != Status.FUNDED && policy.status != Status.PROOF_REQUESTED) revert CancellationUnavailable();
        policy.status = Status.CANCELLED;
        emit PolicyCancelled(policyId, policy.fundedAmount, block.timestamp);
    }

    function refundPolicy(bytes32 policyId) external nonReentrant onlyPolicyOwner(policyId) {
        Policy storage policy = policies[policyId];
        bool refundable = policy.status == Status.CANCELLED || (block.timestamp >= policy.expiry && policy.status != Status.SETTLED && policy.status != Status.REFUNDED);
        if (!refundable) revert CancellationUnavailable();
        uint256 amount = policy.fundedAmount;
        if (amount == 0) revert InvalidAmount();
        policy.fundedAmount = 0;
        policy.status = Status.REFUNDED;
        (bool success,) = payable(policy.owner).call{value: amount}("");
        if (!success) revert TransferFailed(policy.owner, amount);
        emit PolicyRefunded(policyId, policy.owner, amount, block.timestamp);
    }

    function startResultAuthorizerTransfer(address newAuthorizer) external {
        if (msg.sender != resultAuthorizer) revert Unauthorized();
        if (newAuthorizer == address(0)) revert InvalidAddress();
        pendingResultAuthorizer = newAuthorizer;
        emit ResultAuthorizerTransferStarted(resultAuthorizer, newAuthorizer);
    }

    function acceptResultAuthorizerRole() external {
        if (msg.sender != pendingResultAuthorizer) revert Unauthorized();
        address previous = resultAuthorizer;
        resultAuthorizer = msg.sender;
        pendingResultAuthorizer = address(0);
        emit ResultAuthorizerTransferred(previous, msg.sender);
    }

    function configureTeeRegistry(IActiveTeeSet registry, uint256 extensionId) external {
        if (msg.sender != resultAuthorizer || teeRegistryConfigured) revert Unauthorized();
        if (address(registry) == address(0) || extensionId == 0) revert InvalidAddress();
        activeTeeRegistry = registry;
        teeExtensionId = extensionId;
        teeRegistryConfigured = true;
        emit TeeRegistryConfigured(address(registry), extensionId);
    }

    function configureInstructionSender(IAurelithFccInstructionSender sender) external {
        if (msg.sender != resultAuthorizer || address(fccInstructionSender) != address(0)) revert Unauthorized();
        if (address(sender) == address(0) || address(sender).code.length == 0) revert InvalidAddress();
        fccInstructionSender = sender;
        emit InstructionSenderConfigured(address(sender), sender.extensionId());
    }

    function getPolicy(bytes32 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }

    function getParticipants(bytes32 policyId) external view returns (address[] memory recipients, uint16[] memory sharesBps) {
        return (policyRecipients[policyId], policyShares[policyId]);
    }

    function hashSettlementResult(SettlementResult calldata result) public view returns (bytes32) {
        return keccak256(abi.encode("AURELITH_RESULT_V1", block.chainid, address(this), result));
    }

    function _validateParticipants(address[] calldata recipients, uint16[] calldata sharesBps) private pure {
        uint256 length = recipients.length;
        if (length == 0 || length > MAX_PARTICIPANTS || length != sharesBps.length) revert InvalidParticipants();
        uint256 totalShares;
        for (uint256 i; i < length; ++i) {
            if (recipients[i] == address(0)) revert InvalidAddress();
            if (sharesBps[i] == 0) revert InvalidShares();
            totalShares += sharesBps[i];
            for (uint256 j; j < i; ++j) if (recipients[i] == recipients[j]) revert DuplicateRecipient();
        }
        if (totalShares != BPS_DENOMINATOR) revert InvalidShares();
    }

    function _requireState(Policy storage policy, Status expected) private view {
        if (policy.status != expected) revert InvalidState(expected, policy.status);
    }

    function _requireNotExpired(Policy storage policy) private view {
        if (block.timestamp >= policy.expiry) revert PolicyExpired();
    }

    function _ethSigned(bytes32 digest) private pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
    }

    function _isAuthorizedTee(address signer) private view returns (bool) {
        (address[] memory teeIds,) = activeTeeRegistry.getActiveTeeMachines(teeExtensionId);
        if (teeIds.length == 0) revert TeeRegistryUnavailable();
        for (uint256 i; i < teeIds.length; ++i) {
            if (teeIds[i] == signer) return true;
        }
        return false;
    }

    function _recover(bytes32 digest, bytes calldata signature) private pure returns (address signer) {
        if (signature.length != 65) revert InvalidActionResultSignature();
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) revert InvalidActionResultSignature();
        signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert InvalidActionResultSignature();
    }
}
