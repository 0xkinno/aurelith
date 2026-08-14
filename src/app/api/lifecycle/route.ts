import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const file = path.join(process.cwd(), "contracts", "deployments", "coston2-lifecycle.json");
    const lifecycle = JSON.parse(await readFile(file, "utf8"));
    return NextResponse.json({
      network: lifecycle.network,
      chainId: lifecycle.chainId,
      policyId: lifecycle.policyId,
      policyCreationTransactionHash: lifecycle.policyCreationTransactionHash,
      policy: lifecycle.policy,
      funding: lifecycle.funding,
      fdc: lifecycle.fdc,
      fcc: lifecycle.fcc,
      settlement: lifecycle.settlement,
      updatedAt: lifecycle.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: "Lifecycle evidence is unavailable" }, { status: 404 });
  }
}
