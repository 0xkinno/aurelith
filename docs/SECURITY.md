# Security Model

- One-time settlement and terminal-state enforcement.
- Proof, result, and nonce replay protection.
- Recipient and ordered payout binding.
- Chain ID, policy ID, deadline, and exact-total binding.
- Owner authorization for user lifecycle actions.
- Dedicated result-authorizer role with two-step rotation.
- Official FDC verifier configured immutably at deployment.
- Checks-effects-interactions and reentrancy protection.
- No owner drain, arbitrary withdrawal, arbitrary token approval, delegatecall, or upgrade proxy.
- Result outcomes distinguish terminal business ineligibility from retryable unavailable infrastructure; only a terminal authenticated outcome can consume its nonce.
- A settlement result expires no later than its policy escrow window, so a valid result cannot be stranded by a refund.
- Refunds are limited to the exact remaining escrow of a cancelled or expired policy.
- Deployer credentials are server/deployment-only environment variables and never enter browser bundles or manifests.

This is testnet-first hackathon software and is not represented as audited or production-ready.
