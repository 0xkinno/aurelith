import "dotenv/config";
import hardhat from "hardhat";
import { readFile, writeFile } from "node:fs/promises";

const { ethers } = hardhat;
const EXTENSION_ID = 66235n;
const FLARE_TEE_MANAGER = "0x1a9C4A0f9D76c0b1D91d22E24E573a9b377618aE";

async function main() {
  const manifestPath = "contracts/deployments/coston2.json";
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const core = await ethers.getContractAt("AurelithProtocol", manifest.contracts.core.address);
  const sender = await ethers.getContractAt("AurelithFccInstructionSender", manifest.contracts.fccInstructionSender.address);
  let resolveTxHash: string | null = null;
  if ((await sender.extensionId()) === 0n) {
    const tx = await sender.setExtensionId();
    resolveTxHash = tx.hash;
    await tx.wait();
  }
  if (!(await core.teeRegistryConfigured())) {
    const tx = await core.configureTeeRegistry(FLARE_TEE_MANAGER, EXTENSION_ID);
    manifest.fcc.coreBindingTransactionHash = tx.hash;
    await tx.wait();
  }
  const registry = new ethers.Contract(FLARE_TEE_MANAGER, [
    "function getActiveTeeMachines(uint256) view returns (address[] teeIds,string[] urls)",
  ], ethers.provider);
  const [teeIds, urls] = await registry.getActiveTeeMachines(EXTENSION_ID);
  if (!teeIds.length) throw new Error("No active TEE machines for AURELITH extension");
  manifest.fcc.extensionId = EXTENSION_ID.toString();
  manifest.fcc.teeIds = teeIds;
  manifest.fcc.teeUrls = urls;
  manifest.fcc.extProxyUrl = process.env.FCC_EXT_PROXY_URL ?? null;
  manifest.fcc.senderExtensionResolutionTransactionHash = resolveTxHash;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ extensionId: EXTENSION_ID.toString(), teeIds, urls }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
