// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IActiveTeeSet} from "../interfaces/IActiveTeeSet.sol";

contract MockActiveTeeSet is IActiveTeeSet {
    mapping(uint256 => address[]) private active;

    function setActive(uint256 extensionId, address[] calldata teeIds) external {
        active[extensionId] = teeIds;
    }

    function getActiveTeeMachines(uint256 extensionId)
        external
        view
        returns (address[] memory teeIds, string[] memory urls)
    {
        teeIds = active[extensionId];
        urls = new string[](teeIds.length);
    }
}
