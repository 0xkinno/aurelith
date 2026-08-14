# Flare Integration

## Live Coston2 deployment

- AURELITH Core: `0x9D0ED40615845ee6134F475AcCF35e0412CA1EdF`
- FCC instruction sender: `0xFa34633c12e5A93166FAA0E54A3D50Fd62Ae8D49`
- FCC extension ID: `66235` (`0x102bb`)
- Active simulated-development TEE: `0xca183535EfE09a97616b385d4F8334e35F088887`
- FlareTeeManager: `0x1a9C4A0f9D76c0b1D91d22E24E573a9b377618aE`
- FdcVerification: `0x906507E0B64bcD494Db73bd0459d1C667e14B933`

The official post-build flow completed TEE-version allowlisting, extension
governance, preregistration, attestation requests, availability proof, and TEE
registration. Core is bound to the active TEE set for extension `66235`.

The official public FDC verifier requires a separate `X-API-KEY`; FCC/indexer
database credentials are rejected with HTTP 401 and are not interchangeable.
No FDC proof or complete policy settlement may be claimed until that distinct
verifier credential is configured.

## Verified sources

- https://dev.flare.network/network/guides/flare-contracts-registry
- https://dev.flare.network/fdc/guides/hardhat/evm-transaction
- https://dev.flare.network/fdc/guides/hardhat/payment
- https://dev.flare.network/ftso/guides/build-first-app
- https://dev.flare.network/fcc/guides/getting-started
- https://github.com/flare-foundation/fce-extension-scaffold at commit `e3f587949069780084e2ced8a53c9419ed05c250`

The deployment script resolves `FdcVerification`, `FdcHub`, `FdcRequestFeeConfigurations`, and `FtsoV2` by name through the Contracts Registry and validates bytecode before deployment.

Per the official FCC scaffold, AURELITH's registered instruction sender discovers its extension ID, selects TEE machines through `getRandomTeeIds`, and forwards the full instruction fee to `sendInstructions`. Completion requires a real successful ActionResult whose signature is accepted against the active TEE set.

Until the AURELITH extension is registered and an actual ActionResult exists, the UI displays `FCE UNAVAILABLE IN THIS ENVIRONMENT` and never a successful computation.
