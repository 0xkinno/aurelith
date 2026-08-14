# AURELITH Protocol Specification v1

Status: normative design input. This freezes the state, data, authorization, and failure semantics required before Coston2 deployment.

## Final deployed contract topology

The current official Flare FCC registration tool requires the registered
instruction-sender address to already contain bytecode. AURELITH therefore has
two application-owned deployed addresses:

1. `AurelithProtocol` is the comprehensive Core. It exclusively owns policy
   state, participant commitments, escrow, FDC proof state, FCC authenticated
   result state, cancellation/refunds, and settlement execution.
2. `AurelithFccInstructionSender` is the minimum FCC infrastructure adapter.
   Only Core can invoke it. It selects a TEE and forwards the opaque
   `AURELITH/SETTLE` instruction through FlareTeeManager. It cannot authenticate
   results, allocate or custody protocol funds, refund, or settle.

FlareTeeManager and FdcVerification are external Flare system dependencies, not
AURELITH deployments. No feature-specific settlement contracts are deployed.

## Scope

`AurelithProtocol` is one non-upgradeable, comprehensive C2FLR escrow and settlement Core. It supports policies expressed as an ordered recipient vector and authorized by verified external-payment evidence plus an authenticated confidential-computation result.

It is not an RFQ matcher, auction, bond vault, custody service, or ERC-20 router in v1. Those are distinct protocols and must not be silently added as adjacent application contracts.

## Policy identity

`policyId = keccak256("AURELITH_POLICY_V1", chainId, protocol, owner, ownerNonce, salt, policyVersion, ruleHash, paymentReferenceHash, participantHash, targetAmount, expiry)`.

`participantHash = keccak256(orderedRecipients, orderedSharesBps)`. Recipients are non-zero, unique, between one and thirty-two, and shares total exactly 10,000 BPS.

## State machine

| State | Permitted next state | Value movement |
|---|---|---|
| `DRAFT` | `FUNDED`, `CANCELLED`, expiry `REFUNDED` | funding only |
| `FUNDED` | `PROOF_REQUESTED`, `CANCELLED`, expiry `REFUNDED` | none |
| `PROOF_REQUESTED` | `PROOF_VERIFIED`, `CANCELLED`, expiry `REFUNDED` | none |
| `PROOF_VERIFIED` | `COMPUTATION_REQUESTED`, expiry `REFUNDED` | none |
| `COMPUTATION_REQUESTED` | `RESULT_AUTHENTICATED`, `NO_SETTLEMENT_DUE`, expiry `REFUNDED` | none |
| `RESULT_AUTHENTICATED` | `READY_TO_SETTLE`, expiry `REFUNDED` | none |
| `READY_TO_SETTLE` | `SETTLED`, expiry `REFUNDED` | exact payout vector |
| `NO_SETTLEMENT_DUE` | terminal | none |
| `SETTLED` | terminal | exact target released once |
| `CANCELLED` | `REFUNDED` | owner may reclaim escrow |
| `REFUNDED` | terminal | remaining escrow returned once |

`INFRASTRUCTURE_UNKNOWN` and `RESULT_ERROR` are retryable classifications, not terminal states. They do not consume a result nonce, proof digest, or escrow.

## Result envelope

Every authenticated result includes `schemaVersion`, `policyId`, `policyVersion`, `chainId`, `settlementContract`, `externalProofDigest`, `privateInputHash`, `computationReference`, ordered `recipients`, ordered `amounts`, `total`, `nonce`, `issuedAt`, `expiry`, and `outcome`.

- `PAYABLE`: recipients exactly equal bindings; all amounts are positive; total equals target and funded amount.
- `NO_SETTLEMENT_DUE`: total and all amounts are zero; it becomes a terminal audited outcome.
- `INFRASTRUCTURE_UNKNOWN` / `RESULT_ERROR`: rejected fail-closed; retry remains possible.

For FCC mode, the verifier receives the ActionResult envelope and accepts it only if an active TEE for the registered extension signed the exact ABI-encoded AURELITH result. The browser and orchestrator cannot authorize payout amounts.

## Flare evidence

FDC proof verification calls the official verifier discovered through the Flare Contracts Registry. The policy stores only proof digest, source transaction reference, source block/timestamp, request reference, attestation kind, and verification time.

FTSO is read through the registry-resolved `FtsoV2` address for denomination and evidence. Feed data does not independently authorize payout.

## Idempotent orchestration

The orchestrator persists jobs keyed by `(policyId, phase, nonce)`. It creates at most one accepted FDC request per key, resumes finalization/proof retrieval after restart, requests computation only from `PROOF_VERIFIED`, fetches the ActionResult without treating the remote service as authoritative, and never settles without the policy owner's explicit wallet transaction in v1.

Every attempt records request tx, block, external reference, attempt count, last error class, and timestamp. Restart recovery begins from on-chain state.

## Deployment requirements

The deployment gate resolves official Flare dependencies, validates code, passes compile/tests, checks C2FLR balance, deploys `AurelithProtocol` plus the minimum `AurelithFccInstructionSender` registration adapter, generates the frontend ABI from the compiled Core artifact, and writes a manifest containing compiler/ABI version, dependency addresses, deployment transaction/block/timestamp, and FCC registration bindings. The adapter exists solely because the official FCC registration lifecycle requires the instruction-sender address to contain bytecode before registration.
