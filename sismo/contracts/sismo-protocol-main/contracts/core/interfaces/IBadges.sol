// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

/**
 * @title Interface for Badges contract
 * @author Sismo
 * @notice Stateless ERC1155 contract. Reads balance from the values of attestations
 * The associated attestations registry triggers TransferSingle events from this contract
 * It allows badge "shadow mints and burns" to be caught by off-chain platforms
 */
interface IBadges {
  error BadgesNonTransferrable();

  /**
   * @dev Initializes the contract, to be called by the proxy delegating calls to this implementation
   * @param uri Uri for the metadata of badges
   * @param owner Owner of the contract, super admin, can setup roles and update the attestation registry
   * @notice The reinitializer modifier is needed to configure modules that are added through upgrades and that require initialization.
   */
  function initialize(string memory uri, address owner) external;

  /**
   * @dev Main function of the ERC1155 badge
   * The balance of a user is equal to the value of the underlying attestation.
   * attestationCollectionId == badgeId
   * @param account Address to check badge balance (= value of attestation)
   * @param id Badge Id to check (= attestationCollectionId)
   */
  function balanceOf(address account, uint256 id) external view returns (uint256);

  /**
   * @dev Emits a TransferSingle event, so subgraphs and other off-chain apps relying on events can see badge minting/burning
   * can only be called by address having the EVENT_TRIGGERER_ROLE (attestations registry address)
   * @param operator who is calling the TransferEvent
   * @param from address(0) if minting, address of the badge holder if burning
   * @param to address of the badge holder is minting, address(0) if burning
   * @param id badgeId for which to trigger the event
   * @param value minted/burned balance
   */
  function triggerTransferEvent(
    address operator,
    address from,
    address to,
    uint256 id,
    uint256 value
  ) external;

  /**
   * @dev Set the attestations registry address. Can only be called by owner (default admin)
   * @param attestationsRegistry new attestations registry address
   */
  function setAttestationsRegistry(address attestationsRegistry) external;

  /**
   * @dev Set the URI. Can only be called by owner (default admin)
   * @param uri new attestations registry address
   */
  function setUri(string memory uri) external;

  /**
   * @dev Getter of the attestations registry
   */
  function getAttestationsRegistry() external view returns (address);

  /**
   * @dev Getter of the badge issuer
   * @param account Address that holds the badge
   * @param id Badge Id to check (= attestationCollectionId)
   */
  function getBadgeIssuer(address account, uint256 id) external view returns (address);

  /**
   * @dev Getter of the badge timestamp
   * @param account Address that holds the badge
   * @param id Badge Id to check (= attestationCollectionId)
   */
  function getBadgeTimestamp(address account, uint256 id) external view returns (uint32);

  /**
   * @dev Getter of the badge extra data (it can store nullifier and burnCount)
   * @param account Address that holds the badge
   * @param id Badge Id to check (= attestationCollectionId)
   */
  function getBadgeExtraData(address account, uint256 id) external view returns (bytes memory);

  /**
   * @dev Getter of the value of a specific badge attribute
   * @param id Badge Id to check (= attestationCollectionId)
   * @param index Index of the attribute
   */
  function getAttributeValueForBadge(uint256 id, uint8 index) external view returns (uint8);

  /**
   * @dev Getter of all badge attributes and their values for a specific badge
   * @param id Badge Id to check (= attestationCollectionId)
   */
  function getAttributesNamesAndValuesForBadge(
    uint256 id
  ) external view returns (bytes32[] memory, uint8[] memory);
}
