import { encodeAbiParameters } from "viem";
import { beforeEach, describe, expect, it } from "vitest";
import { VERSION } from "../app/config.js";
import * as handlers from "../app/handlers.js";
import { bytesToHex, stringToBytes32Hex } from "../base/encoding.js";
import { Server } from "../base/server.js";

const request = [{ type: "tuple", components: [
  { name: "schemaVersion", type: "bytes32" }, { name: "policyId", type: "bytes32" },
  { name: "externalProofDigest", type: "bytes32" }, { name: "privateInputHash", type: "bytes32" },
  { name: "recipients", type: "address[]" }, { name: "sharesBps", type: "uint16[]" },
  { name: "total", type: "uint256" }, { name: "nonce", type: "uint64" }, { name: "expiry", type: "uint64" },
]}] as const;

let srv: Server;
beforeEach(() => { handlers.resetState(); srv = new Server(0, 0, VERSION, handlers.register, handlers.reportState); });

function action(opType = "AURELITH", opCommand = "SETTLE", malformed = false) {
  const id = `0x${"44".repeat(32)}`;
  const originalMessage = malformed ? "0x1234" : encodeAbiParameters(request, [{
    schemaVersion: "0x415552454c4954485f534554544c454d454e545f563100000000000000000000",
    policyId: `0x${"11".repeat(32)}`, externalProofDigest: `0x${"22".repeat(32)}`,
    privateInputHash: `0x${"33".repeat(32)}`, recipients: ["0x0000000000000000000000000000000000000001"],
    sharesBps: [10000], total: 100n, nonce: 1n, expiry: 2n,
  }]);
  const fixed = { instructionId: id, opType: stringToBytes32Hex(opType), opCommand: stringToBytes32Hex(opCommand), originalMessage };
  return JSON.stringify({ data: { id, type: "instruction", submissionTag: "submit", message: bytesToHex(Buffer.from(JSON.stringify(fixed))) } });
}

describe("AURELITH extension wire contract", () => {
  it("returns a canonical successful ActionResult", async () => {
    const [status, body] = await srv.handleRequest("POST", "/action", action());
    const r = body as Record<string, unknown>;
    expect(status).toBe(200); expect(r.status).toBe(1); expect(r.version).toBe("1.0.0");
    expect(r.opType).toBe(stringToBytes32Hex("AURELITH")); expect(r.opCommand).toBe(stringToBytes32Hex("SETTLE"));
    expect(Object.keys(r).sort()).toEqual(["additionalResultStatus","data","id","log","opCommand","opType","status","submissionTag","version"]);
  });
  it("returns status zero for malformed settlement data", async () => {
    const [status, body] = await srv.handleRequest("POST", "/action", action("AURELITH", "SETTLE", true));
    expect(status).toBe(200); expect((body as Record<string, unknown>).status).toBe(0);
  });
  it("rejects unsupported operations and preserves state version", async () => {
    expect((await srv.handleRequest("POST", "/action", action("NOPE")))[0]).toBe(501);
    const [, state] = await srv.handleRequest("GET", "/state", "");
    expect((state as Record<string, unknown>).stateVersion).toBe(stringToBytes32Hex("1.0.0"));
  });
});
