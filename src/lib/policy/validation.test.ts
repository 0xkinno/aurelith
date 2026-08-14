import { describe, expect, it } from "vitest";
import { validateParticipants } from "./validation";
const addresses = ["0x1111111111111111111111111111111111111111","0x2222222222222222222222222222222222222222","0x3333333333333333333333333333333333333333","0x4444444444444444444444444444444444444444"];
describe("policy participant validation", () => {
  it("accepts an exact waterfall", () => { const r = validateParticipants(addresses.map((address, i) => ({ name: String(i), address, share: [60,20,10,10][i] }))); expect(r.valid).toBe(true); expect(r.sharesBps).toEqual([6000,2000,1000,1000]); });
  it("rejects duplicate recipients", () => { expect(validateParticipants([{name:"A",address:addresses[0],share:50},{name:"B",address:addresses[0],share:50}]).valid).toBe(false); });
  it("rejects invalid addresses and totals", () => { expect(validateParticipants([{name:"A",address:"nope",share:100}]).valid).toBe(false); expect(validateParticipants([{name:"A",address:addresses[0],share:99}]).valid).toBe(false); });
});

