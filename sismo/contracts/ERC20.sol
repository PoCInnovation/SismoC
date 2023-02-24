// SPDX-License-Identifier: MIT License

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract myERC20 is ERC20 {
    constructor(address owner, string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(owner, 100 * 10**uint(decimals()));
    }
}