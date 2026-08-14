# AURELITH Build Audit

Date: 2026-08-13

## Repository state

The repository began as a greenfield workspace containing only `instruction.md`. There was no package manifest, frontend, contract, environment file, deployment record, test suite, or attached hackathon artifact.

## Verified source material

Current official documentation was checked before implementation:

- Flare network getting started: https://dev.flare.network/network/getting-started
- Flare Contracts Registry: https://dev.flare.network/network/guides/flare-contracts-registry
- FDC overview and Hardhat EVM transaction guide: https://dev.flare.network/fdc/overview and https://dev.flare.network/fdc/guides/hardhat/evm-transaction
- FDC verification interface: https://dev.flare.network/fdc/reference/IFdcVerification
- FTSOv2 guide and interface: https://dev.flare.network/ftso/guides/build-first-app and https://dev.flare.network/ftso/solidity-reference/FtsoV2Interface
- Flare Confidential Compute overview/getting started: https://dev.flare.network/fcc/overview and https://dev.flare.network/fcc/guides/getting-started
- Reown AppKit React installation: https://docs.reown.com/appkit/react/core/installation

The in-app documentation browser was unavailable, so official pages and package registries were read directly. No unofficial address list is used as a source of truth.

## Confirmed network values

- Network: Flare Testnet Coston2
- Chain ID: 114
- RPC: https://coston2-api.flare.network/ext/C/rpc
- Explorer: https://coston2-explorer.flare.network
- Native gas token: C2FLR
- Flare system contracts: resolved through the Flare Contracts Registry where supported

## Implemented topology and live status

- `AurelithProtocol` is the sole application/settlement Core. The only additional AURELITH-owned address is `AurelithFccInstructionSender`, the minimum bytecode-bearing adapter required by the official FCC registration lifecycle; it contains no settlement logic or funds.
- Native C2FLR escrow is the first settlement asset. The storage model leaves an explicit asset field for a future intentional version upgrade, but this deployment does not claim ERC-20 settlement support.
- FDC verification uses the official Coston2 `FdcVerification` dependency. The application contract records the verified proof digest and source transaction reference.
- FCC output authentication is fail-closed: Core verifies the canonical ActionResult hash, EIP-191 signature, exact computation/action reference, and active TEE membership for registered extension `66235`. There is no trusted-authorizer fallback.
- FTSOv2 is read-only and meaningful: USD-denominated policy previews use the live XRP/USD or FLR/USD feed when available. The feed is not decorative and unavailable states are explicit.
- Reown AppKit, wagmi, and viem provide the browser wallet and receipt lifecycle.

Core is live at `0x9D0ED40615845ee6134F475AcCF35e0412CA1EdF`; the FCC adapter is live at `0xFa34633c12e5A93166FAA0E54A3D50Fd62Ae8D49`. Deployment evidence and binding transactions are recorded in `contracts/deployments/coston2.json`.

## Remaining integration gate

Compilation, contract tests, frontend tests, production build, FCC registration, active TEE registration, proxy routing, and `/info` health pass. The final real end-to-end settlement demonstration remains blocked at the FDC request stage because Flare's testnet verifier endpoint requires a distinct `VERIFIER_API_KEY_TESTNET`; the supplied FCC/indexer Basic Auth credentials are not that verifier key. AURELITH does not mock or bypass this proof.
