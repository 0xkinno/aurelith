// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IActiveTeeSet {
    function getActiveTeeMachines(uint256 extensionId)
        external
        view
        returns (address[] memory teeIds, string[] memory urls);
}
