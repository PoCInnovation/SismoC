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
    bytes32 signal;
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
    // SemaphoreProof memory extraData = abi.decode(request.claims[0].extraData, (SemaphoreProof));

    // // Init semaphore interface
    // semaphore = ISemaphore(extraData.contractAddress);

    // semaphore.verifyProof(
    //   extraData.groupId,
    //   extraData.merkleTreeRoot,
    //   extraData.signal,
    //   extraData.nullifierHash,
    //   extraData.externalNullifier,
    //   abi.decode(proofData, (uint256[8]))
    // );
  }

  function buildAttestations(
    Request calldata request,
    bytes calldata
  ) public view virtual override returns (Attestation[] memory) {
    Claim memory claim = request.claims[0];

    SemaphoreProof memory extraData = abi.decode(claim.extraData, (SemaphoreProof));

    Attestation[] memory attestations = new Attestation[](1);

    // address ERC20Address = address(uint160(claim.groupId));

    require(_collectionsInternalMapping[extraData.contractAddress][extraData.groupId] != 0, "Group not added to the Attester");

    // uint256 attestationCollectionId = AUTHORIZED_COLLECTION_ID_FIRST + _collectionsInternalMapping[extraData.contractAddress][extraData.groupId];

    // bindSemaphoreGroup(extraData.contractAddress, extraData.groupId, attestationCollectionId);

    attestations[0] = Attestation(
      10001,
      request.destination,
      address(this),
      claim.claimedValue,
      uint32(block.timestamp),
      ''
    );
    console.log("%s && %s", attestations[0].owner, attestations[0].value);
    return (attestations);
  }

  function bindSemaphoreGroup(address _semaphoreAddress, uint256 _groupId) onlyOwner public {
    _collectionsInternalMappingLength++;
    _collectionsInternalMapping[_semaphoreAddress][_groupId] = _collectionsInternalMappingLength;
  }

  // function addGroup(address ERC20Address) onlyOwner external
  // {
  //   if (_collectionsInternalMapping[ERC20Address] == 0) {
  //     _collectionsInternalMappingLength++;
  //     _collectionsInternalMapping[ERC20Address] = _collectionsInternalMappingLength;
  //   }
  // }

// generateAttestations already in the Attester Contract
//   function generateAttestations(Request calldata request, bytes calldata proofData) external override returns (Attestation[] memory)
//   {
//     _verifyRequest(request, proofData);

//     Attestation[] memory attestations = buildAttestations(request, proofData);

//     ATTESTATIONS_REGISTRY.recordAttestations(attestations);

//     for (uint256 i = 0; i < attestations.length; i++) {
//       emit AttestationGenerated(attestations[i]);
//     }

//     return attestations;
//   }
}
