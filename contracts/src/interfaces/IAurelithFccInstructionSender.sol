// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IAurelithFccInstructionSender {
    function extensionId() external view returns (uint256);
    function sendSettlementInstruction(bytes32 policyId, bytes calldata message, address claimBackAddress)
        external payable returns (bytes32 instructionId);
}
