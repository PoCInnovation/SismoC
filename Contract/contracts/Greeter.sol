//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract Voter  {
    event NewVote(bytes32 vote);
    event NewUser(uint256 identityCommitment);

    ISemaphore public semaphore;

    uint256 public groupId;
    // mapping(uint256 => bool) nullifiers;
    uint[] commitments;

    constructor(address semaphoreAddress, uint256 _groupId) {
        semaphore = ISemaphore(semaphoreAddress);
        groupId = _groupId;

        semaphore.createGroup(groupId, 20, 0, address(this));
    }

    function joinGroup(uint256 identityCommitment) external {
        semaphore.addMember(groupId, identityCommitment);
        commitments.push(identityCommitment);

        emit NewUser(identityCommitment);
    }

    function getCommitments() external view returns(uint[] memory) {
        return commitments;
    }

    function vote(
        bytes32 myVote,
        uint256 merkleTreeRoot,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external {
        // require(nullifiers[nullifierHash] == false, "already voted");
        semaphore.verifyProof(groupId, merkleTreeRoot, myVote, nullifierHash, groupId, proof);

        emit NewVote(myVote);
    }
}
