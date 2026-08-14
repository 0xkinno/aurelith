import "dotenv/config";
import hardhat from "hardhat";
import { config as loadEnv } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const { ethers } = hardhat;

const POLICY_ID = "0xc9009d55516e0bcb07cfd9335353194bf6f6205ec7b689ba684089cf2dac4455";
const POLICY_CREATION_TX = "0xa1c15ee68e4f25b555223d5be66e6bb579c0e3d281961f22ce5a5b5ee61a99c6";
const CONTRACT_REGISTRY = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";
const DA_URL = "https://ctn2-data-availability.flare.network/api/v1/fdc/proof-by-request-round-raw";
const VERIFIER_URL = "https://fdc-verifiers-testnet.flare.network/verifier/flr/EVMTransaction/prepareRequest";
const EVIDENCE_PATH = "contracts/deployments/coston2-lifecycle.json";
const STATUS = ["NONE", "DRAFT", "FUNDED", "PROOF_REQUESTED", "PROOF_VERIFIED", "COMPUTATION_REQUESTED", "RESULT_AUTHENTICATED", "READY_TO_SETTLE", "SETTLED", "CANCELLED", "REFUNDED"];
const SCHEMA_VERSION = ethers.encodeBytes32String("AURELITH_SETTLEMENT_V1");
const PRIVATE_INPUT_HASH = ethers.keccak256(ethers.toUtf8Bytes("AURELITH_PRIVATE_INPUT_V1:" + POLICY_ID));

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ path: "fcc-extension/.env", override: false, quiet: true });

type Evidence = Record<string, any>;

async function loadEvidence(): Promise<Evidence> {
  if (!existsSync(EVIDENCE_PATH)) return { network: "Flare Testnet Coston2", chainId: 114, policyId: POLICY_ID, policyCreationTransactionHash: POLICY_CREATION_TX };
  return JSON.parse(await readFile(EVIDENCE_PATH, "utf8"));
}

async function saveEvidence(evidence: Evidence) {
  evidence.updatedAt = new Date().toISOString();
  await writeFile(EVIDENCE_PATH, JSON.stringify(evidence, null, 2) + "\n");
}

async function resolveContract(registry: any, name: string): Promise<string> {
  const address = await registry.getContractAddressByName(name);
  if (address === ethers.ZeroAddress) throw new Error(`${name} is unavailable in the Flare Contract Registry`);
  return address;
}

async function prepareRequest(transactionHash: string) {
  const apiKey = process.env.VERIFIER_API_KEY_TESTNET;
  if (!apiKey) throw new Error("VERIFIER_API_KEY_TESTNET is not configured");
  const response = await fetch(VERIFIER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({
      attestationType: ethers.encodeBytes32String("EVMTransaction"),
      sourceId: ethers.encodeBytes32String("testFLR"),
      requestBody: { transactionHash, requiredConfirmations: "1", provideInput: true, listEvents: true, logIndices: [] },
    }),
  });
  const body = await response.json();
  if (!response.ok || body.status !== "VALID" || !body.abiEncodedRequest) throw new Error(`Verifier rejected request: ${response.status} ${JSON.stringify(body)}`);
  return body;
}

async function retrieveProof(votingRoundId: number, requestBytes: string) {
  const response = await fetch(DA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ votingRoundId, requestBytes }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`DA Layer returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

function toPlainEvmResponse(decoded: any) {
  return {
    attestationType: decoded.attestationType,
    sourceId: decoded.sourceId,
    votingRound: decoded.votingRound,
    lowestUsedTimestamp: decoded.lowestUsedTimestamp,
    requestBody: {
      transactionHash: decoded.requestBody.transactionHash,
      requiredConfirmations: decoded.requestBody.requiredConfirmations,
      provideInput: decoded.requestBody.provideInput,
      listEvents: decoded.requestBody.listEvents,
      logIndices: [...decoded.requestBody.logIndices],
    },
    responseBody: {
      blockNumber: decoded.responseBody.blockNumber,
      timestamp: decoded.responseBody.timestamp,
      sourceAddress: decoded.responseBody.sourceAddress,
      isDeployment: decoded.responseBody.isDeployment,
      receivingAddress: decoded.responseBody.receivingAddress,
      value: decoded.responseBody.value,
      input: decoded.responseBody.input,
      status: decoded.responseBody.status,
      events: decoded.responseBody.events.map((event: any) => ({
        logIndex: event.logIndex,
        emitterAddress: event.emitterAddress,
        topics: [...event.topics],
        data: event.data,
        removed: event.removed,
      })),
    },
  };
}

function toPlainSettlementResult(decoded: any) {
  return {
    policyId: decoded.policyId,
    externalProofDigest: decoded.externalProofDigest,
    privateInputHash: decoded.privateInputHash,
    computationReference: decoded.computationReference,
    recipients: [...decoded.recipients],
    amounts: [...decoded.amounts],
    total: decoded.total,
    nonce: decoded.nonce,
    expiry: decoded.expiry,
  };
}

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY ?? process.env.DEPLOYMENT_PRIVATE_KEY;
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY or DEPLOYMENT_PRIVATE_KEY is not configured");
  const signer = new ethers.Wallet(privateKey, ethers.provider);
  if ((await ethers.provider.getNetwork()).chainId !== 114n) throw new Error("Refusing to run outside Coston2 chain 114");

  const deployment = JSON.parse(await readFile("contracts/deployments/coston2.json", "utf8"));
  const evidence = await loadEvidence();
  const core = await ethers.getContractAt("AurelithProtocol", deployment.contracts.core.address, signer);
  const registry = new ethers.Contract(CONTRACT_REGISTRY, ["function getContractAddressByName(string) view returns (address)"], signer);
  const [fdcHubAddress, feeAddress, systemsAddress, relayAddress, fdcVerificationAddress] = await Promise.all([
    resolveContract(registry, "FdcHub"), resolveContract(registry, "FdcRequestFeeConfigurations"), resolveContract(registry, "FlareSystemsManager"), resolveContract(registry, "Relay"), resolveContract(registry, "FdcVerification"),
  ]);
  evidence.flareContracts = { contractRegistry: CONTRACT_REGISTRY, fdcHub: fdcHubAddress, fdcRequestFeeConfigurations: feeAddress, flareSystemsManager: systemsAddress, relay: relayAddress, fdcVerification: fdcVerificationAddress };

  let policy = await core.getPolicy(POLICY_ID);
  if (policy.owner.toLowerCase() !== signer.address.toLowerCase()) throw new Error(`Configured signer ${signer.address} is not policy owner ${policy.owner}`);
  evidence.policy = { owner: policy.owner, targetAmount: policy.targetAmount.toString(), expiry: policy.expiry.toString(), status: STATUS[Number(policy.status)] };
  await saveEvidence(evidence);

  if (Number(policy.status) === 1) {
    const missing = policy.targetAmount - policy.fundedAmount;
    const tx = await core.fundPolicy(POLICY_ID, { value: missing });
    const receipt = await tx.wait();
    evidence.funding = { transactionHash: tx.hash, blockNumber: receipt!.blockNumber, amount: missing.toString(), status: "CONFIRMED" };
    await saveEvidence(evidence);
    policy = await core.getPolicy(POLICY_ID);
  }

  if (Number(policy.status) === 2 && !evidence.fdc?.requestTransactionHash) {
    const prepared = await prepareRequest(evidence.funding.transactionHash);
    const requestBytes = prepared.abiEncodedRequest;
    const feeContract = new ethers.Contract(feeAddress, ["function getRequestFee(bytes) view returns (uint256)"], signer);
    const requestFee = await feeContract.getRequestFee(requestBytes);
    const fdcHub = new ethers.Contract(fdcHubAddress, ["function requestAttestation(bytes) payable"], signer);
    const tx = await fdcHub.requestAttestation(requestBytes, { value: requestFee });
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt!.blockNumber);
    const systems = new ethers.Contract(systemsAddress, ["function firstVotingRoundStartTs() view returns (uint64)", "function votingEpochDurationSeconds() view returns (uint64)"], signer);
    const first = await systems.firstVotingRoundStartTs();
    const duration = await systems.votingEpochDurationSeconds();
    const votingRoundId = Number((BigInt(block!.timestamp) - first) / duration);
    evidence.fdc = { verifierStatus: prepared.status, requestBytes, requestReference: ethers.keccak256(requestBytes), requestFee: requestFee.toString(), requestTransactionHash: tx.hash, requestBlockNumber: receipt!.blockNumber, votingRoundId, status: "REQUESTED" };
    await saveEvidence(evidence);
  }

  policy = await core.getPolicy(POLICY_ID);
  if (Number(policy.status) === 2) {
    const tx = await core.requestProof(POLICY_ID, evidence.fdc.requestReference);
    const receipt = await tx.wait();
    evidence.fdc.coreProofRequestTransactionHash = tx.hash;
    evidence.fdc.coreProofRequestBlockNumber = receipt!.blockNumber;
    await saveEvidence(evidence);
    policy = await core.getPolicy(POLICY_ID);
  }

  if (Number(policy.status) === 3 && !evidence.fdc?.responseHex) {
    const verification = new ethers.Contract(fdcVerificationAddress, ["function fdcProtocolId() view returns (uint8)"], signer);
    const relay = new ethers.Contract(relayAddress, ["function isFinalized(uint256,uint256) view returns (bool)"], signer);
    const protocolId = await verification.fdcProtocolId();
    const finalized = await relay.isFinalized(protocolId, evidence.fdc.votingRoundId);
    if (!finalized) throw new Error(`FDC voting round ${evidence.fdc.votingRoundId} is not finalized yet; rerun this script after finalization`);
    const proof = await retrieveProof(evidence.fdc.votingRoundId, evidence.fdc.requestBytes);
    if (!proof.response_hex || !Array.isArray(proof.proof)) throw new Error(`DA proof is not ready: ${JSON.stringify(proof)}`);
    evidence.fdc.responseHex = proof.response_hex;
    evidence.fdc.merkleProof = proof.proof;
    evidence.fdc.attestationType = proof.attestation_type;
    evidence.fdc.status = "PROOF_RETRIEVED";
    await saveEvidence(evidence);
  }

  policy = await core.getPolicy(POLICY_ID);
  if (Number(policy.status) === 3 && evidence.fdc?.responseHex) {
    const verificationArtifact = JSON.parse(await readFile("artifacts/@flarenetwork/flare-periphery-contracts/coston2/IEVMTransactionVerification.sol/IEVMTransactionVerification.json", "utf8"));
    const proofInput = verificationArtifact.abi.find((item: any) => item.name === "verifyEVMTransaction").inputs[0];
    const responseParam = proofInput.components[1];
    const decoded = toPlainEvmResponse(ethers.AbiCoder.defaultAbiCoder().decode([responseParam], evidence.fdc.responseHex)[0]);
    const proof = { merkleProof: evidence.fdc.merkleProof, data: decoded };
    if (decoded.responseBody.value < policy.targetAmount) throw new Error(`Retrieved proof value ${decoded.responseBody.value} is below policy target ${policy.targetAmount}`);
    const tx = await core.submitEvmProof(POLICY_ID, proof);
    const receipt = await tx.wait();
    evidence.fdc.proofSubmissionTransactionHash = tx.hash;
    evidence.fdc.proofSubmissionBlockNumber = receipt!.blockNumber;
    evidence.fdc.proofDigest = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode([responseParam], [decoded]));
    evidence.fdc.sourceTransactionHash = decoded.requestBody.transactionHash;
    evidence.fdc.sourceBlockNumber = decoded.responseBody.blockNumber.toString();
    evidence.fdc.sourceTimestamp = decoded.responseBody.timestamp.toString();
    evidence.fdc.sourceValue = decoded.responseBody.value.toString();
    evidence.fdc.status = "VERIFIED_ON_CHAIN";
    await saveEvidence(evidence);
    policy = await core.getPolicy(POLICY_ID);
  }

  if (Number(policy.status) === 4) {
    const [recipients, sharesBps] = await core.getParticipants(POLICY_ID);
    const nextNonce = policy.resultNonce + 1n;
    const message = ethers.AbiCoder.defaultAbiCoder().encode(["tuple(bytes32 schemaVersion,bytes32 policyId,bytes32 externalProofDigest,bytes32 privateInputHash,address[] recipients,uint16[] sharesBps,uint256 total,uint64 nonce,uint64 expiry)"], [{ schemaVersion: SCHEMA_VERSION, policyId: POLICY_ID, externalProofDigest: policy.externalProofDigest, privateInputHash: PRIVATE_INPUT_HASH, recipients, sharesBps, total: policy.targetAmount, nonce: nextNonce, expiry: policy.expiry }]);
    const instructionFee = 1_000_000n;
    const tx = await core.sendComputationInstruction(POLICY_ID, PRIVATE_INPUT_HASH, message, { value: instructionFee });
    const receipt = await tx.wait();
    const event = receipt!.logs.map((log: any) => { try { return core.interface.parseLog(log); } catch { return null; } }).find((log: any) => log?.name === "ComputationRequested");
    evidence.fcc = { instructionTransactionHash: tx.hash, instructionBlockNumber: receipt!.blockNumber, instructionId: event!.args.computationReference, privateInputHash: PRIVATE_INPUT_HASH, instructionFee: instructionFee.toString(), proxyUrl: deployment.fcc.extProxyUrl, status: "REQUESTED" };
    await saveEvidence(evidence);
    policy = await core.getPolicy(POLICY_ID);
  }

  if (Number(policy.status) === 5 && !evidence.fcc?.actionResponse) {
    const url = `${evidence.fcc.proxyUrl}/action/result/${evidence.fcc.instructionId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`FCC ActionResult is not ready: ${response.status} ${response.statusText}; rerun the script while the FCC services are online`);
    const actionResponse = await response.json();
    evidence.fcc.actionResponse = actionResponse;
    evidence.fcc.status = "RESULT_RETRIEVED";
    await saveEvidence(evidence);
  }

  policy = await core.getPolicy(POLICY_ID);
  if (Number(policy.status) === 5 && evidence.fcc?.actionResponse) {
    const response = evidence.fcc.actionResponse;
    const resultTuple = "tuple(bytes32 policyId,bytes32 externalProofDigest,bytes32 privateInputHash,bytes32 computationReference,address[] recipients,uint256[] amounts,uint256 total,uint64 nonce,uint64 expiry)";
    const settlement = toPlainSettlementResult(ethers.AbiCoder.defaultAbiCoder().decode([resultTuple], response.result.data)[0]);
    let signature: string = response.signature;
    if (Number(signature.slice(-2)) < 27) signature = signature.slice(0, -2) + (Number(signature.slice(-2)) + 27).toString(16).padStart(2, "0");
    const tx = await core.authenticateActionResult(settlement, response.result.id, response.result.submissionTag, response.result.status, signature);
    const receipt = await tx.wait();
    evidence.fcc.authenticationTransactionHash = tx.hash;
    evidence.fcc.authenticationBlockNumber = receipt!.blockNumber;
    evidence.fcc.resultDigest = await core.hashSettlementResult(settlement);
    evidence.fcc.status = "AUTHENTICATED_ON_CHAIN";
    evidence.settlementResult = JSON.parse(JSON.stringify(settlement, (_, value) => typeof value === "bigint" ? value.toString() : value));
    await saveEvidence(evidence);
    policy = await core.getPolicy(POLICY_ID);
  }

  if (Number(policy.status) === 7) {
    const resultTuple = "tuple(bytes32 policyId,bytes32 externalProofDigest,bytes32 privateInputHash,bytes32 computationReference,address[] recipients,uint256[] amounts,uint256 total,uint64 nonce,uint64 expiry)";
    const settlement = toPlainSettlementResult(ethers.AbiCoder.defaultAbiCoder().decode([resultTuple], evidence.fcc.actionResponse.result.data)[0]);
    const tx = await core.settle(settlement);
    const receipt = await tx.wait();
    evidence.settlement = { transactionHash: tx.hash, blockNumber: receipt!.blockNumber, status: "CONFIRMED" };
    await saveEvidence(evidence);
    policy = await core.getPolicy(POLICY_ID);
  }

  evidence.policy.status = STATUS[Number(policy.status)];
  evidence.policy.externalProofDigest = policy.externalProofDigest;
  evidence.policy.sourceTransactionHash = policy.sourceTransactionHash;
  evidence.policy.computationReference = policy.computationReference;
  evidence.policy.resultDigest = policy.resultDigest;
  evidence.policy.settledAmount = policy.settledAmount.toString();
  await saveEvidence(evidence);
  console.log(JSON.stringify({ policyId: POLICY_ID, status: evidence.policy.status, evidencePath: EVIDENCE_PATH, fdcRound: evidence.fdc?.votingRoundId ?? null, settlementTransactionHash: evidence.settlement?.transactionHash ?? null }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
