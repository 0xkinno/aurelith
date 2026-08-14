// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ITeeExtensionRegistry} from "../interfaces/ITeeExtensionRegistry.sol";
import {ITeeMachineRegistry} from "../interfaces/ITeeMachineRegistry.sol";

contract MockTeeManager is ITeeExtensionRegistry, ITeeMachineRegistry {
    uint256 public nextPublicExtensionId = 0x10001;
    mapping(uint256 => address) public sender;
    address[] private teeIds;
    bytes32 public nextInstructionId = keccak256("instruction");

    function register(uint256 id, address instructionSender) external { sender[id] = instructionSender; }
    function setTeeIds(address[] calldata ids) external { teeIds = ids; }
    function setInstructionId(bytes32 id) external { nextInstructionId = id; }
    function getTeeExtensionInstructionsSender(uint256 id) external view returns (address) { return sender[id]; }
    function getRandomTeeIds(uint256, uint256) external view returns (address[] memory) { return teeIds; }
    function sendInstructions(address[] calldata, TeeInstructionParams calldata) external payable returns (bytes32) { return nextInstructionId; }
}
