// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;
pragma experimental ABIEncoderV2;

// Core protocol Protocol imports
import {Request, Attestation, Claim} from './sismo-protocol/contracts/core/libs/Structs.sol';
import {Attester, IAttester, IAttestationRegistry} from './sismo-protocol/contracts/Attester.sol';

contract AttesterPassword is Attester {

    uint256 public immutable AUTHORIZED_COLLECTION_ID_FIRST;
    uint256 public immutable AUTHORIZED_COLLECTION_ID_LAST;
    string ATTESTER_PASSPHRASE;

    constructor(
        address attestationRegistryAddress,
        uint256 collectionIdFirst,
        uint256 collectionIdLast,
        string passphrase
    ) Attester(attestationRegistryAddress) {
        AUTHORIZED_COLLECTION_ID_FIRST = collectionIdFirst;
        AUTHORIZED_COLLECTION_ID_LAST = collectionIdLast;
        ATTESTER_PASSPHRASE = passphrase;
    }

    function _verifyRequest(
        Request calldata request,
        bytes calldata proofData
    ) internal virtual override {
        require(proofData == ATTESTER_PASSPHRASE);
    }

    function buildAttestation(
        Request calldata request,
        bytes calldata proofData
    ) public view virtual override(IAttester, Atteser) returns (Attestation[] memory) {
        Attestation[] memory attestations = new Attestation[](1);

        Claim memory claim = request.claims[0];

        uint256 attestationCollectionId = AUTHORIZED_COLLECTION_ID_FIRST + claim.groupId;

        if (attestationCollectionId > AUTHORIZED_COLLECTION_ID_LAST) {
            revert CollectionIdOutOfBound(attestationCollectionId);
        }

        address issuer = address(this);

        attestation[0] = Attestation(
            attestationCollectionId,
            claim.destination,
            issuer,
            claim.claimedValue,
            block.timestamp,
            ''
        );
        return attestations;
    }
}
