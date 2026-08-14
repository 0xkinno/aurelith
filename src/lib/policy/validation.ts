import { getAddress, isAddress } from "viem";

export type ParticipantInput = { name: string; address: string; share: number };

export function validateParticipants(participants: ParticipantInput[]) {
  if (participants.length === 0 || participants.length > 32) return { valid: false, error: "Use between 1 and 32 participants." };
  if (participants.some((p) => !isAddress(p.address))) return { valid: false, error: "Every recipient needs a valid EVM address." };
  if (participants.some((p) => !Number.isInteger(p.share) || p.share <= 0)) return { valid: false, error: "Every recipient needs a positive whole-number share." };
  if (participants.reduce((sum, p) => sum + p.share, 0) !== 100) return { valid: false, error: "Participant shares must total exactly 100%." };
  const addresses = participants.map((p) => getAddress(p.address));
  if (new Set(addresses).size !== addresses.length) return { valid: false, error: "Recipient addresses must be unique." };
  return { valid: true, addresses, sharesBps: participants.map((p) => p.share * 100) };
}

