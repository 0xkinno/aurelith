/**
 * ★ Configuration: version and operation identifiers.
 *
 * Mirrors go/internal/config/config.go. The op-type and op-command strings MUST
 * match the bytes32 constants in contracts/InstructionSender.sol exactly, or
 * actions fall through to "unsupported op type".
 */

export const VERSION = "1.0.0";

export const OP_TYPE_AURELITH = "AURELITH";
export const OP_COMMAND_SETTLE = "SETTLE";
