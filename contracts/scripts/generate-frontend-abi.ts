import { readFile, writeFile } from "node:fs/promises";

const artifactPath = "artifacts/contracts/src/AurelithProtocol.sol/AurelithProtocol.json";
const outputPath = "src/lib/flare/aurelithProtocolAbi.ts";

async function main() {
  const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as { abi?: unknown };
  if (!Array.isArray(artifact.abi) || artifact.abi.length === 0) {
    throw new Error(`Compiled ABI missing from ${artifactPath}`);
  }

  const source = [
    "// Generated from the compiled AurelithProtocol artifact. Do not edit by hand.",
    `export const AURELITH_PROTOCOL_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;`,
    "",
  ].join("\n");

  await writeFile(outputPath, source, "utf8");
  console.log(`Generated ${outputPath} (${artifact.abi.length} ABI entries)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
