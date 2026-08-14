import { decodeAbiParameters, encodeAbiParameters } from "viem";
import { beforeEach, describe, expect, it } from "vitest";
import { handleSettlement, reportState, resetState } from "../app/handlers.js";

const request = [{ type: "tuple", components: [
  { name: "schemaVersion", type: "bytes32" }, { name: "policyId", type: "bytes32" },
  { name: "externalProofDigest", type: "bytes32" }, { name: "privateInputHash", type: "bytes32" },
  { name: "recipients", type: "address[]" }, { name: "sharesBps", type: "uint16[]" },
  { name: "total", type: "uint256" }, { name: "nonce", type: "uint64" }, { name: "expiry", type: "uint64" },
]}] as const;
const result = [{ type: "tuple", components: [
  { name: "policyId", type: "bytes32" }, { name: "externalProofDigest", type: "bytes32" },
  { name: "privateInputHash", type: "bytes32" }, { name: "computationReference", type: "bytes32" },
  { name: "recipients", type: "address[]" }, { name: "amounts", type: "uint256[]" },
  { name: "total", type: "uint256" }, { name: "nonce", type: "uint64" }, { name: "expiry", type: "uint64" },
]}] as const;

beforeEach(resetState);

describe("AURELITH/SETTLE", () => {
  it("returns an exact ordered allocation bound to the instruction id", () => {
    const policyId = `0x${"11".repeat(32)}` as const;
    const actionId = `0x${"44".repeat(32)}` as const;
    const msg = encodeAbiParameters(request, [{
      schemaVersion: "0x415552454c4954485f534554544c454d454e545f563100000000000000000000",
      policyId, externalProofDigest: `0x${"22".repeat(32)}`, privateInputHash: `0x${"33".repeat(32)}`,
      recipients: ["0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000002"],
      sharesBps: [6000, 4000], total: 101n, nonce: 1n, expiry: 2n,
    }]);
    const response = handleSettlement(msg, actionId);
    expect(response[1]).toBe(1);
    const [decoded] = decodeAbiParameters(result, response[0] as `0x${string}`);
    expect(decoded.computationReference).toBe(actionId);
    expect(decoded.amounts).toEqual([60n, 41n]);
    expect(reportState()).toEqual({ processed: 1, lastPolicyId: policyId.slice(2) });
  });

  it("rejects missing action IDs and malformed allocation input", () => {
    expect(handleSettlement("0x", undefined)[1]).toBe(0);
    expect(handleSettlement("0x1234", `0x${"44".repeat(32)}`)[1]).toBe(0);
  });
});
