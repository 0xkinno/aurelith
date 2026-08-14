import { decodeAbiParameters, encodeAbiParameters, type Hex } from "viem";

const requestParams = [{
  type: "tuple",
  components: [
    { name: "schemaVersion", type: "bytes32" },
    { name: "policyId", type: "bytes32" },
    { name: "externalProofDigest", type: "bytes32" },
    { name: "privateInputHash", type: "bytes32" },
    { name: "recipients", type: "address[]" },
    { name: "sharesBps", type: "uint16[]" },
    { name: "total", type: "uint256" },
    { name: "nonce", type: "uint64" },
    { name: "expiry", type: "uint64" },
  ],
}] as const;

const resultParams = [{
  type: "tuple",
  components: [
    { name: "policyId", type: "bytes32" },
    { name: "externalProofDigest", type: "bytes32" },
    { name: "privateInputHash", type: "bytes32" },
    { name: "computationReference", type: "bytes32" },
    { name: "recipients", type: "address[]" },
    { name: "amounts", type: "uint256[]" },
    { name: "total", type: "uint256" },
    { name: "nonce", type: "uint64" },
    { name: "expiry", type: "uint64" },
  ],
}] as const;

export function decodeAndComputeSettlement(data: Hex, actionId: Hex): { data: Hex; policyId: Hex } {
  const [request] = decodeAbiParameters(requestParams, data);
  if (request.schemaVersion !== "0x415552454c4954485f534554544c454d454e545f563100000000000000000000") throw new Error("unsupported schema");
  if (!request.recipients.length || request.recipients.length !== request.sharesBps.length) throw new Error("invalid participants");
  let shares = 0;
  const amounts = request.sharesBps.map((share) => { shares += Number(share); return request.total * BigInt(share) / 10_000n; });
  if (shares !== 10_000) throw new Error("invalid shares");
  const allocated = amounts.reduce((sum, amount) => sum + amount, 0n);
  amounts[amounts.length - 1] += request.total - allocated;
  return { policyId: request.policyId, data: encodeAbiParameters(resultParams, [{
    policyId: request.policyId,
    externalProofDigest: request.externalProofDigest,
    privateInputHash: request.privateInputHash,
    computationReference: actionId,
    recipients: [...request.recipients],
    amounts,
    total: request.total,
    nonce: request.nonce,
    expiry: request.expiry,
  }]) };
}
