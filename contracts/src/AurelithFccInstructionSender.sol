// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ITeeExtensionRegistry} from "./interfaces/ITeeExtensionRegistry.sol";
import {ITeeMachineRegistry} from "./interfaces/ITeeMachineRegistry.sol";

/// @notice Minimal FCC registration adapter. It has no settlement authority and
/// can only forward instructions originating from AURELITH Core.
contract AurelithFccInstructionSender {
    bytes32 public constant OP_TYPE = bytes32("AURELITH");
    bytes32 public constant OP_COMMAND_SETTLE = bytes32("SETTLE");
    uint256 private constant FIRST_PUBLIC_EXTENSION_ID = 0x10000;

    address public immutable AURELITH_CORE;
    ITeeExtensionRegistry public immutable TEE_EXTENSION_REGISTRY;
    ITeeMachineRegistry public immutable TEE_MACHINE_REGISTRY;
    uint256 public extensionId;

    error Unauthorized();
    error InvalidAddress();
    error InvalidMessage();
    error ExtensionUnavailable();

    event ExtensionIdResolved(uint256 indexed extensionId);
    event InstructionSent(bytes32 indexed policyId, bytes32 indexed instructionId, address indexed claimBackAddress);

    constructor(address core, ITeeExtensionRegistry extensionRegistry, ITeeMachineRegistry machineRegistry) {
        if (core == address(0) || address(extensionRegistry) == address(0) || address(machineRegistry) == address(0)) {
            revert InvalidAddress();
        }
        if (address(extensionRegistry).code.length == 0 || address(machineRegistry).code.length == 0) revert InvalidAddress();
        AURELITH_CORE = core;
        TEE_EXTENSION_REGISTRY = extensionRegistry;
        TEE_MACHINE_REGISTRY = machineRegistry;
    }

    function setExtensionId() external {
        if (extensionId != 0) revert ExtensionUnavailable();
        uint256 ceiling = TEE_EXTENSION_REGISTRY.nextPublicExtensionId();
        for (uint256 i = FIRST_PUBLIC_EXTENSION_ID; i < ceiling; ++i) {
            if (TEE_EXTENSION_REGISTRY.getTeeExtensionInstructionsSender(i) == address(this)) {
                extensionId = i;
                emit ExtensionIdResolved(i);
                return;
            }
        }
        revert ExtensionUnavailable();
    }

    function sendSettlementInstruction(bytes32 policyId, bytes calldata message, address claimBackAddress)
        external payable returns (bytes32 instructionId)
    {
        if (msg.sender != AURELITH_CORE) revert Unauthorized();
        if (extensionId == 0) revert ExtensionUnavailable();
        if (policyId == bytes32(0) || message.length == 0 || claimBackAddress == address(0)) revert InvalidMessage();
        address[] memory teeIds = TEE_MACHINE_REGISTRY.getRandomTeeIds(extensionId, 1);
        address[] memory cosigners = new address[](0);
        instructionId = TEE_EXTENSION_REGISTRY.sendInstructions{value: msg.value}(
            teeIds,
            ITeeExtensionRegistry.TeeInstructionParams({
                opType: OP_TYPE,
                opCommand: OP_COMMAND_SETTLE,
                message: message,
                cosigners: cosigners,
                cosignersThreshold: 0,
                claimBackAddress: claimBackAddress
            })
        );
        emit InstructionSent(policyId, instructionId, claimBackAddress);
    }
}
