# Architecture

## Core protocol

`AurelithProtocol` is the only AURELITH application and settlement authority. It owns the complete lifecycle and was designed before its first Coston2 deployment. `AurelithFccInstructionSender` is a minimal FCC registration adapter required by Flare's live registration flow: only Core may call it, and it has no policy storage, custody, result-authentication, refund, allocation, or settlement authority.

States:

`DRAFT -> FUNDED -> PROOF_REQUESTED -> PROOF_VERIFIED -> COMPUTATION_REQUESTED -> RESULT_AUTHENTICATED -> READY_TO_SETTLE -> SETTLED`

Recovery states:

`DRAFT/FUNDED/PROOF_REQUESTED -> CANCELLED` after authorization and applicable deadlines. A cancelled funded policy can be refunded exactly once. Expired unsettled policies can be refunded by the owner. Terminal states are `SETTLED`, `CANCELLED`, and `REFUNDED`.

Authenticated result outcomes are explicit: `PAYABLE` proceeds to `READY_TO_SETTLE`; `NO_SETTLEMENT_DUE` is a terminal zero-value result with an audit event; `INFRASTRUCTURE_UNKNOWN` is rejected without consuming the result nonce and remains retryable. This prevents a transient FDC/FCC outage from being misrepresented as a business decision.

## Orchestration

The off-chain orchestrator is not a settlement authority. It records idempotency keys `(policyId, phase, nonce)`, source request transaction hashes, FDC voting round / request identifiers, FCE instruction identifiers, last observed block, and retry classification. It only submits transactions permitted by the contract and treats on-chain event/state reads as authoritative. A crash may delay progress but cannot create a second FDC request acceptance, a second authenticated result, or a second payout.

## Trust boundaries

- Policy owner: creates, binds recipients, funds, requests proof/computation, settles, cancels, and refunds within contract rules.
- Participants: fixed recipient addresses committed at creation. They cannot be substituted during settlement.
- FDC verifier: official Flare verification contract configured at deployment from registry resolution.
- FCC active TEE set: Core recovers the canonical EIP-191 ActionResult signer and requires that signer to be active for extension `66235` in FlareTeeManager. The instruction sender cannot authenticate a result.
- Browser: never authoritative for proof status, totals, recipients, result authentication, or settlement state.

## Commitments

- `policyId` binds owner nonce, chain ID, rule hash, payment reference hash, recipients, shares, asset, target amount, and expiry.
- `participantHash` binds ordered recipients and basis-point shares.
- `proofDigest` binds the verified FDC response and source transaction reference.
- `resultDigest` binds policy, proof, private input commitment, recipients, amounts, nonce, expiry, and chain ID.
- `usedProofDigests`, `usedResultDigests`, and per-policy result nonces prevent replay.

## Settlement

The contract checks state, expiry, chain ID, participant binding, array lengths, amount sum, escrow balance, proof/result replay status, and authenticated result digest before transferring native C2FLR. State is finalized before external calls and guarded against reentrancy.
