import type { Framework, HandlerResult } from "../base/types.js";
import { decodeAndComputeSettlement } from "./abi.js";
import { OP_COMMAND_SETTLE, OP_TYPE_AURELITH } from "./config.js";

let processed = 0;
let lastPolicyId = "";

export function resetState(): void { processed = 0; lastPolicyId = ""; }
export function reportState(): unknown { return { processed, lastPolicyId }; }
export function register(framework: Framework): void { framework.handle(OP_TYPE_AURELITH, OP_COMMAND_SETTLE, handleSettlement); }

export function handleSettlement(message: string, actionId?: string): HandlerResult {
  try {
    if (!actionId) return [null, 0, "missing action id"];
    const result = decodeAndComputeSettlement(message as `0x${string}`, actionId as `0x${string}`);
    processed++;
    lastPolicyId = result.policyId.slice(2);
    return [result.data, 1, null];
  } catch (error) {
    return [null, 0, error instanceof Error ? error.message : String(error)];
  }
}
