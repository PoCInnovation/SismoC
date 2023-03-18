// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "../ISemaphore.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

// Core protocol Protocol imports
// sismo/sismo-protocol-main/contracts/core
import {Request, Attestation, Claim} from './sismo-protocol-main/contracts/core/libs/Structs.sol';
import {Attester, IAttester, IAttestationsRegistry} from './sismo-protocol-main/contracts/core/Attester.sol';

/**
 * @title Semaphore Attester
 * @author PoC Innovation
 */
contract SemaphoreAttester is Attester, Ownable {

  // Structure passed as a parameter as proofData containing everything the attester needs to work
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

  // List of contracts and group ids handled by the attester
  mapping(address => mapping(uint256 => uint256)) public _collectionsInternalMapping;
  uint256 public _collectionsInternalMappingLength = 0;

  // Semaphore interface
  ISemaphore public semaphore;

  /**
   * @dev Constructor. Initializes the contract
   * @param owner Address of the attester owner
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

  /**
   * @dev It should verify the user request is valid
   * @param request User request
   * @param proofData Data sent along the request to prove its validity
   */
  function _verifyRequest(Request calldata request, bytes calldata proofData) internal virtual override
  {
    SemaphoreProof memory extraData = abi.decode(request.claims[0].extraData, (SemaphoreProof));

    // Init semaphore interface
    semaphore = ISemaphore(extraData.contractAddress);

    // Verify the user proof using verifyProof from semaphore interface
    semaphore.verifyProof(
      extraData.groupId,
      extraData.merkleTreeRoot,
      extraData.signal,
      extraData.nullifierHash,
      extraData.externalNullifier,
      abi.decode(proofData, (uint256[8]))
    );
  }

  /**
   * @dev It should build attestations from the user request and the proof
   * @param request User request
   * @param proofData Data sent along the request to prove its validity
   * @return attestations Attestations that will be recorded
   */
  function buildAttestations(
    Request calldata request,
    bytes calldata proofData
  ) public view virtual override returns (Attestation[] memory) {
    Claim memory claim = request.claims[0];

    SemaphoreProof memory extraData = abi.decode(claim.extraData, (SemaphoreProof));

    Attestation[] memory attestations = new Attestation[](1);

    // Check if the group of the contract is handled by the attester
    require(_collectionsInternalMapping[extraData.contractAddress][extraData.groupId] != 0, "Group not added to the Attester");

    uint256 attestationCollectionId = AUTHORIZED_COLLECTION_ID_FIRST + _collectionsInternalMapping[extraData.contractAddress][extraData.groupId];

    // Create attestation
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

  /**
   * @dev Add a Semaphore contract to the list of contracts handled by the attester
   * @param _semaphoreAddress Semaphore contract address to handle
   * @param _groupId Group ID of the Semaphore contract to be handled by the attester
   */
  function bindSemaphoreGroup(address _semaphoreAddress, uint256 _groupId) public {
    _collectionsInternalMappingLength++;
    _collectionsInternalMapping[_semaphoreAddress][_groupId] = _collectionsInternalMappingLength;
  }

}
