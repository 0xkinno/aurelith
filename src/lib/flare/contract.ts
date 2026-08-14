import type { Address } from "viem";
import { AURELITH_PROTOCOL_ABI } from "./aurelithProtocolAbi";

export const AURELITH_ADDRESS = (process.env.NEXT_PUBLIC_AURELITH_CONTRACT_ADDRESS ?? "") as Address;
export const AURELITH_ABI = AURELITH_PROTOCOL_ABI;
