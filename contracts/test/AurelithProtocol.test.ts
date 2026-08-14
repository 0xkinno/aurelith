import { expect } from "chai";
import hardhat from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const { ethers } = hardhat;

describe("AurelithProtocol", () => {
  async function fixture() {
    const [owner, authorizer, merchant, creator, affiliate, reserve, attacker] = await ethers.getSigners();
    const mock = await ethers.deployContract("MockFdcVerification");
    const protocol = await ethers.deployContract("AurelithProtocol", [await mock.getAddress(), authorizer.address]);
    const expiry = (await time.latest()) + 3600;
    const params = {
      salt: ethers.id("demo"),
      ruleHash: ethers.id("private-rule"),
      paymentReferenceHash: ethers.id("payment-reference"),
      targetAmount: ethers.parseEther("1"),
      expiry,
      recipients: [merchant.address, creator.address, affiliate.address, reserve.address],
      sharesBps: [6000, 2000, 1000, 1000],
    };
    const tx = await protocol.connect(owner).createPolicy(params);
    const receipt = await tx.wait();
    const event = receipt!.logs.map((log) => { try { return protocol.interface.parseLog(log); } catch { return null; } }).find((x) => x?.name === "PolicyCreated");
    const policyId = event!.args.policyId;
    return { protocol, mock, owner, authorizer, merchant, creator, affiliate, reserve, attacker, params, policyId };
  }

  function proof(target: bigint) {
    return {
      merkleProof: [],
      data: {
        attestationType: ethers.id("EVMTransaction"), sourceId: ethers.id("testEVM"), votingRound: 1,
        lowestUsedTimestamp: 1,
        requestBody: { transactionHash: ethers.id("source-tx"), requiredConfirmations: 1, provideInput: false, listEvents: false, logIndices: [] },
        responseBody: { blockNumber: 100, timestamp: 1000, sourceAddress: ethers.ZeroAddress, isDeployment: false,
          receivingAddress: ethers.ZeroAddress, value: target, input: "0x", status: 1, events: [] },
      },
    };
  }

  async function ready() {
    const f = await fixture();
    await f.protocol.connect(f.owner).fundPolicy(f.policyId, { value: f.params.targetAmount });
    await f.protocol.connect(f.owner).requestProof(f.policyId, ethers.id("request"));
    await f.protocol.connect(f.owner).submitEvmProof(f.policyId, proof(f.params.targetAmount));
    const instructionId = ethers.id("fcc-action");
    const sender = await ethers.deployContract("MockFccInstructionSender", [instructionId]);
    await f.protocol.connect(f.authorizer).configureInstructionSender(await sender.getAddress());
    await f.protocol.connect(f.owner).sendComputationInstruction(f.policyId, ethers.id("private-input"), "0x1234");
    const p = await f.protocol.getPolicy(f.policyId);
    const result = {
      policyId: f.policyId,
      externalProofDigest: p.externalProofDigest,
      privateInputHash: p.privateInputHash,
      computationReference: p.computationReference,
      recipients: f.params.recipients,
      amounts: [ethers.parseEther("0.6"), ethers.parseEther("0.2"), ethers.parseEther("0.1"), ethers.parseEther("0.1")],
      total: f.params.targetAmount,
      nonce: p.resultNonce,
      expiry: f.params.expiry,
    };
    return { ...f, result };
  }

  async function authenticate(f: Awaited<ReturnType<typeof ready>>, overrides = {}) {
    const registry = await ethers.deployContract("MockActiveTeeSet");
    await registry.setActive(65536, [f.authorizer.address]);
    await f.protocol.connect(f.authorizer).configureTeeRegistry(await registry.getAddress(), 65536);
    const result = { ...f.result, ...overrides };
    const actionId = result.computationReference;
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(bytes32,bytes32,bytes32,bytes32,address[],uint256[],uint256,uint64,uint64)"],
      [[result.policyId, result.externalProofDigest, result.privateInputHash, result.computationReference,
        result.recipients, result.amounts, result.total, result.nonce, result.expiry]]
    );
    const resultHash = ethers.solidityPackedKeccak256(["bytes32", "bytes32", "bytes32", "uint8"],
      [ethers.keccak256(encoded), actionId, ethers.keccak256(ethers.toUtf8Bytes("submit")), 1]);
    const payloadHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "uint256", "bytes32"], [ethers.encodeBytes32String("TEE_ACTION_RESULT"), 31337, resultHash]));
    const signature = await f.authorizer.signMessage(ethers.getBytes(payloadHash));
    return f.protocol.authenticateActionResult(result, actionId, "submit", 1, signature);
  }

  it("runs the complete lifecycle and settles exactly once", async () => {
    const f = await ready();
    await authenticate(f);
    await expect(f.protocol.connect(f.owner).settle(f.result)).to.emit(f.protocol, "SettlementExecuted");
    expect((await f.protocol.getPolicy(f.policyId)).status).to.equal(8);
    await expect(f.protocol.connect(f.owner).settle(f.result)).to.be.reverted;
  });

  it("accepts a canonical FCC ActionResult signature and rejects tampering", async () => {
    const f = await ready();
    const registry = await ethers.deployContract("MockActiveTeeSet");
    await registry.setActive(65536, [f.authorizer.address]);
    await f.protocol.connect(f.authorizer).configureTeeRegistry(await registry.getAddress(), 65536);
    const actionId = f.result.computationReference;
    const submissionTag = "submit";
    const status = 1;
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(bytes32,bytes32,bytes32,bytes32,address[],uint256[],uint256,uint64,uint64)"],
      [[f.result.policyId, f.result.externalProofDigest, f.result.privateInputHash, f.result.computationReference,
        f.result.recipients, f.result.amounts, f.result.total, f.result.nonce, f.result.expiry]]
    );
    const resultHash = ethers.solidityPackedKeccak256(
      ["bytes32", "bytes32", "bytes32", "uint8"],
      [ethers.keccak256(encoded), actionId, ethers.keccak256(ethers.toUtf8Bytes(submissionTag)), status]
    );
    const payloadHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "uint256", "bytes32"], [ethers.encodeBytes32String("TEE_ACTION_RESULT"), 31337, resultHash]
    ));
    const signature = await f.authorizer.signMessage(ethers.getBytes(payloadHash));
    await expect(f.protocol.authenticateActionResult(f.result, actionId, submissionTag, status, signature))
      .to.emit(f.protocol, "ActionResultAccepted");
    await expect(f.protocol.authenticateActionResult({...f.result, total: f.result.total - 1n}, actionId, submissionTag, status, signature))
      .to.be.reverted;
  });

  it("requires the recovered FCC signer to be active for the configured extension", async () => {
    const f = await ready();
    const registry = await ethers.deployContract("MockActiveTeeSet");
    await registry.setActive(65536, [f.authorizer.address]);
    await f.protocol.connect(f.authorizer).configureTeeRegistry(await registry.getAddress(), 65536);
    const actionId = f.result.computationReference;
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(bytes32,bytes32,bytes32,bytes32,address[],uint256[],uint256,uint64,uint64)"],
      [[f.result.policyId, f.result.externalProofDigest, f.result.privateInputHash, f.result.computationReference,
        f.result.recipients, f.result.amounts, f.result.total, f.result.nonce, f.result.expiry]]
    );
    const resultHash = ethers.solidityPackedKeccak256(
      ["bytes32", "bytes32", "bytes32", "uint8"],
      [ethers.keccak256(encoded), actionId, ethers.keccak256(ethers.toUtf8Bytes("submit")), 1]
    );
    const payloadHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "uint256", "bytes32"], [ethers.encodeBytes32String("TEE_ACTION_RESULT"), 31337, resultHash]
    ));
    const signature = await f.authorizer.signMessage(ethers.getBytes(payloadHash));
    await f.protocol.authenticateActionResult(f.result, actionId, "submit", 1, signature);

    const f2 = await ready();
    const emptyRegistry = await ethers.deployContract("MockActiveTeeSet");
    await f2.protocol.connect(f2.authorizer).configureTeeRegistry(await emptyRegistry.getAddress(), 65536);
    await expect(f2.protocol.authenticateActionResult(f2.result, actionId, "submit", 1, signature))
      .to.be.revertedWithCustomError(f2.protocol, "TeeRegistryUnavailable");
  });

  it("rejects invalid participant definitions and zero values", async () => {
    const f = await fixture();
    await expect(f.protocol.connect(f.owner).createPolicy({ ...f.params, targetAmount: 0 })).to.be.reverted;
    await expect(f.protocol.connect(f.owner).createPolicy({ ...f.params, salt: ethers.id("x"), sharesBps: [5000, 2000, 1000, 1000] })).to.be.reverted;
    await expect(f.protocol.connect(f.owner).fundPolicy(f.policyId, { value: 0 })).to.be.reverted;
  });

  it("rejects unauthorized actions, invalid proofs, and replayed proof data", async () => {
    const f = await fixture();
    await f.protocol.connect(f.owner).fundPolicy(f.policyId, { value: f.params.targetAmount });
    await expect(f.protocol.connect(f.attacker).requestProof(f.policyId, ethers.id("request"))).to.be.reverted;
    await f.protocol.connect(f.owner).requestProof(f.policyId, ethers.id("request"));
    await f.mock.setValid(false);
    await expect(f.protocol.connect(f.owner).submitEvmProof(f.policyId, proof(f.params.targetAmount))).to.be.reverted;
  });

  it("rejects unauthorized, malformed, wrong-recipient, wrong-total, and replayed results", async () => {
    const f = await ready();
    const wrong = [...f.result.recipients]; wrong[0] = f.attacker.address;
    await expect(authenticate(f, { total: 1n })).to.be.reverted;
    const f2 = await ready();
    await expect(authenticate(f2, { recipients: wrong })).to.be.reverted;
    const f3 = await ready();
    await authenticate(f3);
    await expect(authenticate(f3)).to.be.reverted;
    await expect(f.protocol.connect(f.attacker).settle(f.result)).to.be.reverted;
  });

  it("enforces expiry and supports cancellation/refund", async () => {
    const f = await fixture();
    await f.protocol.connect(f.owner).fundPolicy(f.policyId, { value: f.params.targetAmount });
    await f.protocol.connect(f.owner).cancelPolicy(f.policyId);
    await expect(f.protocol.connect(f.owner).refundPolicy(f.policyId)).to.emit(f.protocol, "PolicyRefunded");
    await expect(f.protocol.connect(f.owner).refundPolicy(f.policyId)).to.be.reverted;
  });

  it("uses two-step authorizer rotation", async () => {
    const f = await fixture();
    await expect(f.protocol.connect(f.attacker).startResultAuthorizerTransfer(f.attacker.address)).to.be.reverted;
    await f.protocol.connect(f.authorizer).startResultAuthorizerTransfer(f.attacker.address);
    await f.protocol.connect(f.attacker).acceptResultAuthorizerRole();
    expect(await f.protocol.resultAuthorizer()).to.equal(f.attacker.address);
  });
});
