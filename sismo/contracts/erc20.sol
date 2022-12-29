// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.14;

contract MyToken {
    address private owner;

    constructor() {
        owner = msg.sender;
    }

    mapping(address => uint256) private _balances;

    function mint(address to, uint256 amount) public {
        require(msg.sender == owner, "you aren't owner");

        _balances[to] += amount;
    }

    function transfer(address to, uint256 amount) public {
        require(_balances[msg.sender] >= amount, "not enough money");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
}
