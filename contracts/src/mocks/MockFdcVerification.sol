// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IEVMTransaction} from "@flarenetwork/flare-periphery-contracts/coston2/IEVMTransaction.sol";

contract MockFdcVerification {
    bool public valid = true;

    function setValid(bool value) external {
        valid = value;
    }

    function verifyEVMTransaction(IEVMTransaction.Proof calldata) external view returns (bool) {
        return valid;
    }
}

