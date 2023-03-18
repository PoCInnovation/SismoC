// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "../ISemaphore.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

// Core protocol Protocol imports
// sismo/sismo-protocol-main/contracts/core
import {Request, Attestation, Claim} from './sismo-protocol-main/contracts/core/libs/Structs.sol';
import {Attester, IAttester, IAttestationsRegistry} from './sismo-protocol-main/contracts/core/Attester.sol';

contract SemaphoreAttester is Attester, Ownable {

  struct SemaphoreProof {
    uint256 signal;
    uint256 merkleTreeRoot;
    uint256 nullifierHash;
    uint256 externalNullifier;
    uint256 groupId;
    address contractAddress;
  }

  uint256 public immutable AUTHORIZED_COLLECTION_ID_FIRST;
  uint256 public immutable AUTHORIZED_COLLECTION_ID_LAST;

  mapping(address => mapping(uint256 => uint256)) public _collectionsInternalMapping;
  uint256 public _collectionsInternalMappingLength = 0;

  // Semaphore interface
  ISemaphore public semaphore;

  /**
   * @dev Constructor. Initializes the contract
   * @param attestationsRegistryAddress Attestations Registry contract on which the attester will write attestations
   * @param collectionIdFirst Id of the first collection in which the attester is supposed to record
   * @param collectionIdLast Id of the last collection in which the attester is supposed to record
   */
  constructor(
    address owner,
    address attestationsRegistryAddress,
    uint256 collectionIdFirst,
    uint256 collectionIdLast
  ) Attester(attestationsRegistryAddress) {
    AUTHORIZED_COLLECTION_ID_FIRST = collectionIdFirst;
    AUTHORIZED_COLLECTION_ID_LAST = collectionIdLast;
    _transferOwnership(owner);
  }

  function _verifyRequest(Request calldata request, bytes calldata proofData) internal virtual override
  {
    SemaphoreProof memory extraData = abi.decode(request.claims[0].extraData, (SemaphoreProof));

    console.log(" extraData.contractAddress --> %s ", extraData.contractAddress);
    console.log("extraData.groupId --> %d ", extraData.groupId);
    console.log("LEOOOOOO ---> %d", _collectionsInternalMapping[extraData.contractAddress][extraData.groupId]);
    // Init semaphore interface
    semaphore = ISemaphore(extraData.contractAddress);

    semaphore.verifyProof(
      extraData.groupId,
      extraData.merkleTreeRoot,
      extraData.signal,
      extraData.nullifierHash,
      extraData.externalNullifier,
      abi.decode(proofData, (uint256[8]))
    );

  }

  function buildAttestations(
    Request calldata request,
    bytes calldata
  ) public view virtual override returns (Attestation[] memory) {
    Claim memory claim = request.claims[0];

    SemaphoreProof memory extraData = abi.decode(claim.extraData, (SemaphoreProof));

    Attestation[] memory attestations = new Attestation[](1);

    console.log(" extraData.contractAddress --> %s ", extraData.contractAddress);
    console.log("extraData.groupId --> %d ", extraData.groupId);
    console.log("LEOOOOOO ---> %d", _collectionsInternalMapping[extraData.contractAddress][extraData.groupId]);
    require(_collectionsInternalMapping[extraData.contractAddress][extraData.groupId] != 0, "Group not added to the Attester");

    uint256 attestationCollectionId = AUTHORIZED_COLLECTION_ID_FIRST + _collectionsInternalMapping[extraData.contractAddress][extraData.groupId];

    attestations[0] = Attestation(
      attestationCollectionId,
      request.destination,
      address(this),
      claim.claimedValue,
      uint32(block.timestamp),
      ''
    );
    return (attestations);
  }

  function bindSemaphoreGroup(address _semaphoreAddress, uint256 _groupId) public {
    _collectionsInternalMappingLength++;
    console.log("_collectionsInternalMappingLength ---> %d ", _collectionsInternalMappingLength);
    _collectionsInternalMapping[_semaphoreAddress][_groupId] = _collectionsInternalMappingLength;
  }

}