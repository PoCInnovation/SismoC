// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;
pragma experimental ABIEncoderV2;

import {Attester, IAttester, IAttestationsRegistry} from "./sismo-protocol-main/contracts/core/Attester.sol";
import {Request, Attestation, Claim} from "./sismo-protocol-main/contracts/core/libs/Structs.sol";
import {MyToken} from "./erc20.sol";

contract MyAttester is Attester, MyToken {
    uint256 public immutable AUTHORIZED_COLLECTION_ID_FIRST;
    uint256 public immutable AUTHORIZED_COLLECTION_ID_LAST;
    address public owner;

    constructor(
        address attestationsRegistryAddress,
        uint256 collectionIdFirst,
        uint256 collectionIdLast
    ) Attester(attestationsRegistryAddress) {
        AUTHORIZED_COLLECTION_ID_FIRST = collectionIdFirst;
        AUTHORIZED_COLLECTION_ID_LAST = collectionIdLast;
    }

    function NotInGroup(uint256 groupId) public pure returns (string memory) {
        return "Account are not in the group ";
    }

    function ClaimValueInvalid(uint256 tokenBalance, uint256 claimedValue)
        public
        pure
        returns (string memory)
    {
        return "Not enough money ";
    }

    function _verifyRequest(Request calldata request, bytes calldata proofData)
        internal
        virtual
        override
    {
        Claim memory claim = request.claims[0];

        uint256 tokenBalance = balanceOf(msg.sender);
        if (tokenBalance <= 10**claim.groupId) {
            revert(NotInGroup(claim.groupId));
        }
        if (tokenBalance > 10**(claim.groupId + 1))
            revert(NotInGroup(claim.groupId));
        if (tokenBalance != claim.claimedValue)
            revert(ClaimValueInvalid(tokenBalance, claim.claimedValue));
    }

    function buildAttestations(
        Request calldata request,
        bytes calldata proofData
    ) public view override returns (Attestation[] memory) {
        Attestation[] memory attestations = new Attestation[](1);

        Claim memory claim = request.claims[0];

        uint256 attestationCollectionId = AUTHORIZED_COLLECTION_ID_FIRST +
            claim.groupId;

        address issuer = address(this);

        attestations[0] = Attestation(
            attestationCollectionId,
            request.destination,
            issuer,
            claim.claimedValue,
            uint32(block.timestamp),
            "hello isma !"
        );
        return (attestations);
    }
}
