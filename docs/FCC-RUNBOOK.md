# AURELITH FCC Coston2 runbook

The current Flare Developer Hub requires the FCC scaffold stack: an extension
TEE, `ext-proxy`, and Redis. The proxy reads Flare's C-chain indexer through a
read-only database connection. For Coston2 the documented indexer is
`34.38.42.208:3306`, database `indexer`; credentials are provided only through
the local environment and are never sent to the browser.

The FCC/indexer username and password are service credentials consumed by
`ext-proxy`; there is no browser login step. They authenticate the proxy's
database connection. Keep Ubuntu/WSL Docker, `extension-tee`, `ext-proxy`,
Redis, and the public tunnel running whenever AURELITH must receive or process
FCC instructions. The on-chain registrations persist if WSL stops, but the
local execution path becomes unavailable.

The quick Cloudflare tunnel URL is ephemeral. After a tunnel restart, update
`EXT_PROXY_URL`, verify `/info`, and update the registered TEE URL if it changed
before sending another instruction.

FCC/indexer credentials are separate from the FDC verifier credential. The
official FDC guide expects `VERIFIER_API_KEY_TESTNET`; indexer Basic Auth and
the indexer password used as `X-API-KEY` both return `401 Unauthorized`.

Required live settings:

- `LOCAL_MODE=false`
- `SIMULATED_TEE=true` for the Coston2 testnet development attestation path
- `NORMAL_PROXY_URL=https://tee-proxy-coston2-1.flare.rocks`
- a publicly reachable HTTPS `EXT_PROXY_URL` forwarding to local proxy port 6674

The extension must be registered once through the scaffold's pre-build flow.
The resulting extension ID and instruction sender are then reused; forcing a
new pre-build creates a new registration and is prohibited for AURELITH.

Validation sequence:

1. Start the extension TEE, ext-proxy, and Redis services.
2. Confirm local `/info` and public `$EXT_PROXY_URL/info` are healthy.
3. Confirm `machineData.extensionId` matches the registered extension ID.
4. Run post-build registration and verify the active TEE set through the
   FlareTeeManager MachineManager facet.
5. Send one real instruction through the AURELITH sender and poll the proxy
   for the ActionResult.
6. Reconstruct the canonical ActionResult hash and verify the EIP-191 signer
   against the active TEE set on-chain.
7. Only after this succeeds may the core contract deployment gate proceed.

Until an actual extension registration, proxy URL, TEE ID, and ActionResult
are available, AURELITH must display an unavailable/pending FCC state rather
than claim successful confidential computation.
