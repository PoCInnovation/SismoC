//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@semaphore-protocol/contracts/Semaphore.sol";

contract semaphore is Semaphore {
    constructor(Verifier[] memory _verifiers) Semaphore(_verifiers) {

    }
}