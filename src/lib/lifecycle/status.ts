import { hasHash } from "./LifecycleProvider";

export type LifecycleStageState = "PENDING" | "PROCESSING" | "VERIFIED" | "COMPLETED";

export function getLifecycleStageStates(policy: any) {
  const status = policy ? Number(policy.status) : 0;
  return {
    externalEvent: hasHash(policy?.sourceTransactionHash) ? "VERIFIED" : "PENDING",
    fdcProof: status >= 4 && hasHash(policy?.externalProofDigest) ? "VERIFIED" : "PENDING",
    privateCompute: status >= 6 && hasHash(policy?.computationReference) ? "VERIFIED" : status === 5 ? "PROCESSING" : "PENDING",
    verifiedResult: status >= 6 && hasHash(policy?.resultDigest) ? "VERIFIED" : "PENDING",
    settlement: status === 8 && Number(policy?.settledAt ?? 0) > 0 ? "COMPLETED" : "PENDING",
  } as const;
}

export function shortHash(value?: string, start = 10, end = 6) {
  if (!value) return "PENDING";
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}
