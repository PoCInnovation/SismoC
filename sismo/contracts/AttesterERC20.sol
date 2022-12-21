// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// Core protocol Protocol imports
// sismo/sismo-protocol-main/contracts/core
import {Request, Attestation, Claim} from './sismo-protocol-main/contracts/core/libs/Structs.sol';
import {Attester, IAttester, IAttestationsRegistry} from './sismo-protocol-main/contracts/core/Attester.sol';

contract AttesterERC20 is Attester, Ownable {

  uint256 public immutable AUTHORIZED_COLLECTION_ID_FIRST;
  uint256 public immutable AUTHORIZED_COLLECTION_ID_LAST;

  mapping(address => uint256) public _collectionsInternalMapping;
  uint256 public _collectionsInternalMappingLength = 0;

  /**
   * @dev Constructor. Initializes the contract
   * @param attestationsRegistryAddress Attestations Registry contract on which the attester will write attestations
   * @param collectionIdFirst Id of the first collection in which the attester is supposed to record
   * @param collectionIdLast Id of the last collection in which the attester is supposed to record
   */
  constructor(address owner, address attestationsRegistryAddress, uint256 collectionIdFirst, uint256 collectionIdLast) Attester(attestationsRegistryAddress)
  {
    AUTHORIZED_COLLECTION_ID_FIRST = collectionIdFirst;
    AUTHORIZED_COLLECTION_ID_LAST = collectionIdLast;
    _transferOwnership(owner);
  }

  function _verifyRequest(Request calldata request, bytes calldata proofData) internal virtual override
  {
    Claim memory claim = request.claims[0];

    address tokenAddress = address(uint160(claim.groupId));

    uint256 tokenBalance = ERC20(tokenAddress).balanceOf(msg.sender);

    require(tokenBalance >= claim.claimedValue, "Not Enough Tokens");
  }

  function buildAttestations(Request calldata request, bytes calldata) public view virtual override returns (Attestation[] memory)
  {
    Attestation[] memory attestations = new Attestation[](1);

    Claim memory claim = request.claims[0];

    address ERC20Address = address(uint160(claim.groupId));

    require(_collectionsInternalMapping[ERC20Address] != 0, "Group not added to the Attester");

    uint256 attestationCollectionId = AUTHORIZED_COLLECTION_ID_FIRST + _collectionsInternalMapping[ERC20Address];

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

  function addGroup(address ERC20Address) onlyOwner external
  {
    if (_collectionsInternalMapping[ERC20Address] == 0) {
      _collectionsInternalMappingLength++;
      _collectionsInternalMapping[ERC20Address] = _collectionsInternalMappingLength;
    }
  }

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