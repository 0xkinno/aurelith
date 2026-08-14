import "dotenv/config";
import hardhat from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const { ethers } = hardhat;
const MIN_BALANCE = ethers.parseEther("0.05");
const FDC_VERIFICATION = "0x906507E0B64bcD494Db73bd0459d1C667e14B933";
const FLARE_TEE_MANAGER = "0x1a9C4A0f9D76c0b1D91d22E24E573a9b377618aE";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("DEPLOYER_PRIVATE_KEY is not configured");
  if ((await ethers.provider.getNetwork()).chainId !== 114n) throw new Error("Refusing to deploy outside Coston2 chain 114");
  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance < MIN_BALANCE) throw new Error(`Insufficient C2FLR balance: ${ethers.formatEther(balance)}`);
  for (const [name, address] of [["FdcVerification", FDC_VERIFICATION], ["FlareTeeManager", FLARE_TEE_MANAGER]] as const) {
    if ((await ethers.provider.getCode(address)) === "0x") throw new Error(`${name} has no bytecode at ${address}`);
  }

  const core = await ethers.deployContract("AurelithProtocol", [FDC_VERIFICATION, deployer.address]);
  await core.waitForDeployment();
  const coreTx = core.deploymentTransaction();
  const coreReceipt = await coreTx!.wait();

  const sender = await ethers.deployContract("AurelithFccInstructionSender", [
    await core.getAddress(), FLARE_TEE_MANAGER, FLARE_TEE_MANAGER,
  ]);
  await sender.waitForDeployment();
  const senderTx = sender.deploymentTransaction();
  const senderReceipt = await senderTx!.wait();
  const configureTx = await core.configureInstructionSender(await sender.getAddress());
  await configureTx.wait();

  let commitHash: string | null = null;
  try { commitHash = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch {}
  const manifest = {
    network: "Flare Testnet Coston2", chainId: 114, deployedAt: new Date().toISOString(),
    deployer: deployer.address, compilerVersion: "0.8.28", abiVersion: "AURELITH_PROTOCOL_V1",
    commitHash,
    contracts: {
      core: { address: await core.getAddress(), deploymentTransactionHash: coreTx!.hash, deploymentBlock: coreReceipt!.blockNumber },
      fccInstructionSender: { address: await sender.getAddress(), deploymentTransactionHash: senderTx!.hash, deploymentBlock: senderReceipt!.blockNumber },
    },
    flareDependencies: { fdcVerification: FDC_VERIFICATION, flareTeeManager: FLARE_TEE_MANAGER },
    fcc: { extensionId: null, teeIds: [], extProxyUrl: null, registrationTransactionHash: null },
  };
  await mkdir("contracts/deployments", { recursive: true });
  await writeFile("contracts/deployments/coston2.json", JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ core: manifest.contracts.core.address, fccInstructionSender: manifest.contracts.fccInstructionSender.address }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
