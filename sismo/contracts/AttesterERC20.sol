// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

// Core protocol Protocol imports
// sismo/sismo-protocol-main/contracts/core
import {Request, Attestation, Claim} from './sismo-protocol-main/contracts/core/libs/Structs.sol';
import {Attester, IAttester, IAttestationsRegistry} from './sismo-protocol-main/contracts/core/Attester.sol';

contract AttesterERC20 is Attester, Ownable {

  uint256 public immutable AUTHORIZED_COLLECTION_ID_FIRST;
  uint256 public immutable AUTHORIZED_COLLECTION_ID_LAST;

  mapping(uint256 => address) internal _ticketsDestinations;

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

  }

  function buildAttestations(Request calldata request, bytes calldata) public view virtual override returns (Attestation[] memory)
  {
  }
}