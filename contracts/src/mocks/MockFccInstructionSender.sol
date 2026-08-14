// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IAurelithFccInstructionSender} from "../interfaces/IAurelithFccInstructionSender.sol";

contract MockFccInstructionSender is IAurelithFccInstructionSender {
    uint256 public constant extensionId = 0x10000;
    bytes32 public immutable instructionId;
    constructor(bytes32 id) { instructionId = id; }
    function sendSettlementInstruction(bytes32, bytes calldata, address) external payable returns (bytes32) {
        return instructionId;
    }
}
