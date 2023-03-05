//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract Voter {
    event NewVote(bytes32 vote);
    event NewUser(uint256 identityCommitment);

    ISemaphore public semaphore;

  struct SemaphoreProof {
    bytes32 signal;
    uint256 merkleTreeRoot;
    uint256 nullifierHash;
    uint256 externalNullifier;
    uint256 groupId;
    address contractAddress;
  }

    uint256 public groupId;
    // mapping(uint256 => bool) nullifiers;
    uint256[] commitments;

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

    function getCommitments() external view returns (uint256[] memory) {
        return commitments;
    }

    function vote(
        bytes calldata extra,
        bytes calldata proofData
    ) external {
        SemaphoreProof memory extraData = abi.decode(extra, (SemaphoreProof));

        console.log(" extraData.groupId --> %d ", extraData.groupId);
        console.log("extraData.merkleTreeRoot --> %d ", extraData.merkleTreeRoot);
        console.log("extraData.signal --> %d ", extraData.signal);
        console.log("extraData.nullifierHash --> %d ", extraData.nullifierHash);
        console.log("extraData.externalNullifier --> %d ", extraData.externalNullifier);
        // require(nullifiers[nullifierHash] == false, "already voted");
        semaphore.verifyProof(
        extraData.groupId,
        extraData.merkleTreeRoot,
        extraData.signal,
        extraData.nullifierHash,
        extraData.externalNullifier,
        abi.decode(proofData, (uint256[8]))
        );

        emit NewVote(extraData.signal);
    }
}
