// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;
pragma experimental ABIEcoderV2;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

import {Request, Attestation, Claim} from './sismo-protocol/contracts/core/libs/Structs.sol';
import {Attester, IAttester, IAttestationRegistry} from './sismo-protocol/contracts/core/Attester.sol';

/**
 * @title Semaphore Attester
 * @author PoC Innovation
 * @notice ...
 */
abstract contract SemaphoreAttester is Attester {

    struct SemaphoreProof {
        bytes32 signal;
        uint256 merkleTreeRoot;
        uint256 nullifierHash;
        uint256 externalNullifier;
        uint256 groupId;
        address contractAddress;
    }

    // The deployed contract will need to be authorized to write into the Attestation registry
    // It should get write access on attestation collections from AUTHORIZED_COLLECTION_ID_FIRST to AUTHORIZED_COLLECTION_ID_LAST.
    uint256 public immutable AUTHORIZED_COLLECTION_ID_FIRST;
    uint256 public immutable AUTHORIZED_COLLECTION_ID_LAST;

    // Semaphore interface
    ISemaphore public semaphore;

    // Store groupId and semaphore contract address
    mapping (semaphore contract -> groupID -> registryID);

    /*******************************************************
        INITIALIZATION FUNCTIONS
    *******************************************************/

    /**
     * @dev Constructor. Initializes the contract
     * @param attestationsRegistryAddress Attestations Registry contract on which the attester will write attestations
     * @param semaphoreAddress Semaphore address
     * @param collectionIdFirst Id of the first collection in which the attester is supposed to record
     * @param collectionIdLast Id of the last collection in which the attester is supposed to record
     */
    constructor(
        address attestationRegistryAddress,
        address semaphoreAddress,
        uint256 collectionIdFirst,
        uint256 collectionIfLast
    ) Attester(attesttationRegistryAddress) {
        AUTHORIZED_COLLECTION_ID_FIRST = collectionIdFirst;
        AUTHORIZED_COLLECTION_ID_LAST = collectionIfLast;

        // Initialize semaphore interface
        semaphore = ISemaphore(semaphoreAddress);
    }

    /*******************************************************
        MANDATORY FUNCTIONS TO OVERRIDE FROM ATTESTER.SOL
    *******************************************************/

    /**
     * @dev Throws if user request is invalid when verified against
     * @param request users request. Claim of having an account of part of a group accounts
     * @param proofData provided to back the request. Semaphore ZK-Proof
     */
    function _verifyRequest(
        Request calldata request,
        bytes calldata proofData
    ) internal virtual override {
        // Decode proofData in SemaphoreProof struct
        SemaphoreProof memory extraData = abi.decode(request.claims[0], (SemaphoreProof));
        uint256 groupId = extraData.signal;

        // Verify sempahore ZK-Proof provided by the user
        semaphore.verifyProof(groupId, extraData.merkleTreeRoot, extraData.signal, extraData.externalNullifier, groupId, proofData);
    }

    /**
     * @dev Returns attestations that will be recorded, constructed from the user request
     * @param request users request. Claim of having an account part of a group accounts
     * @param proofData provided to back the request. Semaphore ZK-Proof
     */
    function buildAttestations(
        Request calldata request,
        bytes calldata proofData
    ) public view virtual override(IAttester, Attester) returns (Attestations[] memory) {
        semaphoreProof memory extraData = abi.decode(request.claims[0], (SemaphoreProof));

        Attesttation[] memory attestations = new Attestation[](1);

        Claim memory claim = request.claims[0];

        // uint256 attestationCollectionId = AUTHORIZED_COLLECTION_ID_FIRST + claim.groupId;

        // if (attestationCollectionId > AUTHORIZED_COLLECTION_ID_LAST) {
        //     revert CollectionIdOutOfBound(attestationCollectionId);
        // }

        address issuer = address(this);

        attestation[0] = Attestation(
            attestationCollectionId,
            claim.destination,
            issuer,
            claim.claimValue,
            block.timestamp,
            ''
        );
        return attestations;
    }
}
