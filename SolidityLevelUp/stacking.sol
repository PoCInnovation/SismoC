// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

import "./ERC20.sol";

contract Staker {
    bool internal locked;

    address public owner;

    uint256 public initialTimestamp;
    bool public timestampSet;
    uint256 public timePeriod;
    uint public stackingReward;

    mapping(address => uint256) public alreadyWithdrawn;
    mapping(address => uint256) public balances;

    IERC20 public erc20Contract;

    constructor(address _erc20_contract_address, uint stackingReward_) {
        owner = msg.sender;
        timestampSet = false;
        require(address(_erc20_contract_address) != address(0), "erc20_contract_address address can not be zero");
        erc20Contract = ERC20(_erc20_contract_address);
        locked = false;
        stackingReward = stackingReward_;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Message sender must be the contract's owner.");
        _;
    }

    modifier timestampIsSet() {
        require(timestampSet == true, "Please set the time stamp first, then try again.");
        _;
    }

    function setStackingReward(uint stackingReward_) public onlyOwner {
        stackingReward = stackingReward_;
    }

    function setTimestamp(uint256 _timePeriodInSeconds) public onlyOwner  {
        timestampSet = true;
        initialTimestamp = block.timestamp;
        timePeriod = initialTimestamp + _timePeriodInSeconds;
    }

    function stakeTokens(IERC20 token, uint256 amount) public timestampIsSet {
        require(token == erc20Contract, "You are only allowed to stake the official erc20 token address which was passed into this contract's constructor");
        require(amount <= token.balanceOf(msg.sender), "Not enough STATE tokens in your wallet, please try lesser amount");
        token.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] = balances[msg.sender] + amount;
    }

    function unstakeTokens(uint256 amount) public timestampIsSet {
        require(balances[msg.sender] >= amount, "Insufficient token balance, try lesser amount");
        if (block.timestamp >= timePeriod) {
            alreadyWithdrawn[msg.sender] = alreadyWithdrawn[msg.sender] + amount;
            balances[msg.sender] = balances[msg.sender] - amount;
            erc20Contract.transfer(msg.sender, amount);
            erc20Contract.mint(msg.sender, amount);
        } else {
            revert("Tokens are only available after correct time period has elapsed");
        }
    }
}