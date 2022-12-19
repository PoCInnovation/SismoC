import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { getImplementation } from '../../../../utils';
import { deploymentsConfig } from '../../../../tasks/deploy-tasks/deployments-config';
import {
  AttestationsRegistry,
  Badges,
  TransparentUpgradeableProxy__factory,
} from '../../../../types';
import { formatBytes32String, parseBytes32String } from 'ethers/lib/utils';
import { evmRevert, evmSnapshot } from '../../../../test/utils';

describe('Test Attestations Registry Config Logic contract', () => {
  let deployer: SignerWithAddress;
  let secondDeployer: SignerWithAddress;
  let notOwner: SignerWithAddress;
  let issuer: SignerWithAddress;

  let attestationsRegistry: AttestationsRegistry;
  let secondAttestationsRegistry: AttestationsRegistry;
  let badges: Badges;

  let snapshotId: string;

  before(async () => {
    const signers = await ethers.getSigners();

    [deployer, secondDeployer, notOwner, issuer] = signers;
  });

  /*************************************************************************************/
  /********************************** DEPLOYMENTS **************************************/
  /*************************************************************************************/
  describe('Deployments', () => {
    it('Should deploy, setup and test the constructed values of the contract', async () => {
      ({ attestationsRegistry, badges } = await hre.run('deploy-core', {
        uri: 'https://token_cdn.domain/',
        badgeOwner: deployer.address,
        frontFirstCollectionId: '1',
        frontLastCollectionId: '2',
      }));

      ({ attestationsRegistry: secondAttestationsRegistry } = await hre.run(
        'deploy-attestations-registry',
        {
          badges: secondDeployer.address,
          owner: secondDeployer.address,
        }
      ));

      // 0 - Checks that the owner is set to the deployer address
      expect(await attestationsRegistry.owner()).to.equal(deployer.address);
      expect(await secondAttestationsRegistry.owner()).to.equal(secondDeployer.address);

      snapshotId = await evmSnapshot(hre);
    });
  });

  describe('Singles', async () => {
    const authorizedRangeIndex = 0;
    let authorizedRange: { min: number; max: number };

    before(async () => {
      authorizedRange = {
        min: 3,
        max: 6,
      };
    });

    /*************************************************************************************/
    /********************************** AUTHORIZE RANGE **********************************/
    /*************************************************************************************/
    describe('Authorize Range', async () => {
      it('Should revert when the sender is not the owner of the contract', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .authorizeRange(issuer.address, authorizedRange.min, authorizedRange.max)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should authorize the range for the attester', async () => {
        const authorizeIssuerRangeTransaction = await attestationsRegistry.authorizeRange(
          issuer.address,
          authorizedRange.min,
          authorizedRange.max
        );

        // 1 - Checks that the transaction emitted the event
        await expect(authorizeIssuerRangeTransaction)
          .to.emit(attestationsRegistry, 'IssuerAuthorized')
          .withArgs(issuer.address, authorizedRange.min, authorizedRange.max);

        // 2 - Checks that the issuer is authorized for the range
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRange.min)).to.be
          .true;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRange.max)).to.be
          .true;

        // 3 - Checks that the issuer is not authorized outside of his boundaries
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRange.min - 1)).to
          .be.false;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRange.max + 1)).to
          .be.false;

        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRange.min + 1)).to
          .be.true;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRange.max - 1)).to
          .be.true;
      });
    });

    /*************************************************************************************/
    /********************************* UNAUTHORIZE RANGE *********************************/
    /*************************************************************************************/
    describe('Unauthorize range', async () => {
      it('Should revert when the sender is not the owner of the contract', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .unauthorizeRange(
              issuer.address,
              authorizedRangeIndex,
              authorizedRange.min,
              authorizedRange.max
            )
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert when the collection id is superior than the authorizedRanges of the issuer', async () => {
        const unauthorizedRangeIndex = authorizedRangeIndex + 1;

        await expect(
          attestationsRegistry.unauthorizeRange(
            issuer.address,
            unauthorizedRangeIndex,
            authorizedRange.min,
            authorizedRange.max
          )
        ).to.be.revertedWith(
          `RangeIndexOutOfBounds("${issuer.address}", 1, ${unauthorizedRangeIndex})`
        );
      });

      it('Should revert when the firstCollectionId mismatch the collection min', async () => {
        await expect(
          attestationsRegistry.unauthorizeRange(
            issuer.address,
            authorizedRangeIndex,
            authorizedRange.min - 1,
            authorizedRange.max
          )
        ).to.be.revertedWith(
          `IdsMismatch("${issuer.address}", ${authorizedRangeIndex}, ${authorizedRange.min}, ${
            authorizedRange.max
          }, ${authorizedRange.min - 1}, ${authorizedRange.max})`
        );
      });

      it('Should revert when the lastCollectionId mistmatch the collection max', async () => {
        await expect(
          attestationsRegistry.unauthorizeRange(
            issuer.address,
            authorizedRangeIndex,
            authorizedRange.min,
            authorizedRange.max + 1
          )
        ).to.be.revertedWith(
          `IdsMismatch("${issuer.address}", ${authorizedRangeIndex}, ${authorizedRange.min}, ${
            authorizedRange.max
          }, ${authorizedRange.min}, ${authorizedRange.max + 1})`
        );
      });

      it('Should unauthorize the range for the issuer', async () => {
        const unauthorizeIssuerRangeTransaction = await attestationsRegistry.unauthorizeRange(
          issuer.address,
          authorizedRangeIndex,
          authorizedRange.min,
          authorizedRange.max
        );

        // 1 - Checks that the transaction emitted the event
        await expect(unauthorizeIssuerRangeTransaction)
          .to.emit(attestationsRegistry, 'IssuerUnauthorized')
          .withArgs(issuer.address, authorizedRange.min, authorizedRange.max);

        // 2 - Checks that the issuer is authorized for the range
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRange.min)).to.be
          .false;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRange.max)).to.be
          .false;
      });
    });
  });

  describe('Batches', () => {
    let authorizedRangeIndexes = [0, 1];
    let authorizedRangeLength = 2;
    let authorizedRanges: { min: number; max: number }[] = [];

    before(async () => {
      authorizedRanges = [
        {
          min: 3,
          max: 6,
        },
        {
          min: 9,
          max: 12,
        },
      ];
    });

    /*************************************************************************************/
    /********************************** AUTHORIZE RANGES *********************************/
    /*************************************************************************************/
    describe('Authorize Ranges', () => {
      it('Should revert when the sender is not the owner of the contract', async () => {
        await expect(
          attestationsRegistry.connect(notOwner).authorizeRanges(issuer.address, authorizedRanges)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should authorize the ranges', async () => {
        const authorizeIssuerRangeTransaction = await attestationsRegistry.authorizeRanges(
          issuer.address,
          authorizedRanges
        );

        // 1 - Checks that the transaction emitted the event
        // 1.1 - Checks that the transaction emitted the first event
        await expect(authorizeIssuerRangeTransaction)
          .to.emit(attestationsRegistry, 'IssuerAuthorized')
          .withArgs(issuer.address, authorizedRanges[0].min, authorizedRanges[0].max);

        // 1.2 - Checks that the transaction emitted the second event
        await expect(authorizeIssuerRangeTransaction)
          .to.emit(attestationsRegistry, 'IssuerAuthorized')
          .withArgs(issuer.address, authorizedRanges[1].min, authorizedRanges[1].max);

        // 2 - Checks that the issuer is authorized for the range
        // 2.1 - Checks that the issuer is authorized for the first range
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[0].min)).to
          .be.true;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[0].max)).to
          .be.true;

        // 2.2 - Checks that the issuer is authorized for the second range
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[1].min)).to
          .be.true;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[1].max)).to
          .be.true;

        // 3 - Checks that the issuer is not authorized outside of his boundaries
        // 3.1 - Checks that the issuer is not authorized outside of the first range
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[0].min - 1))
          .to.be.false;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[0].max + 1))
          .to.be.false;

        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[0].min + 1))
          .to.be.true;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[0].max - 1))
          .to.be.true;

        // 3.2 - Checks that the issuer is not authorized outside of the first range
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[1].min - 1))
          .to.be.false;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[1].max + 1))
          .to.be.false;

        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[1].min + 1))
          .to.be.true;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[1].max - 1))
          .to.be.true;
      });
    });

    /*************************************************************************************/
    /********************************* UNAUTHORIZE RANGES ********************************/
    /*************************************************************************************/
    describe('Unauthorize Ranges', async () => {
      it('Should revert when the sender is not the owner of the contract', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .unauthorizeRanges(issuer.address, authorizedRanges, authorizedRangeIndexes)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert when one of the collection ids is superior than the authorizedRanges of the issuer', async () => {
        const unauthorizedRangeIndexes = [
          authorizedRangeIndexes[0] + 2,
          authorizedRangeIndexes[1] + 1,
        ];

        await expect(
          attestationsRegistry.unauthorizeRanges(
            issuer.address,
            authorizedRanges,
            unauthorizedRangeIndexes
          )
        ).to.be.revertedWith(
          `RangeIndexOutOfBounds("${issuer.address}", ${authorizedRangeLength}, ${unauthorizedRangeIndexes[1]})`
        );

        unauthorizedRangeIndexes[0] -= 2;

        authorizedRangeLength -= 1;

        await expect(
          attestationsRegistry.unauthorizeRanges(
            issuer.address,
            authorizedRanges,
            unauthorizedRangeIndexes
          )
        ).to.be.revertedWith(
          `RangeIndexOutOfBounds("${issuer.address}", ${authorizedRangeLength}, ${
            unauthorizedRangeIndexes[1] - 1
          })`
        );
      });

      it('Should revert when the firstRangeFirstCollectionId mismatch the first collection min', async () => {
        await expect(
          attestationsRegistry.unauthorizeRanges(
            issuer.address,
            [
              {
                min: authorizedRanges[0].min - 1,
                max: authorizedRanges[0].max,
              },
              authorizedRanges[1],
            ],
            authorizedRangeIndexes
          )
        ).to.be.revertedWith(
          `IdsMismatch("${issuer.address}", ${authorizedRangeIndexes[0]}, ${
            authorizedRanges[0].min
          }, ${authorizedRanges[0].max}, ${authorizedRanges[0].min - 1}, ${
            authorizedRanges[0].max
          })`
        );
      });

      it('Should revert when the firstRangeLastCollectionId mismatch the first collection max', async () => {
        await expect(
          attestationsRegistry.unauthorizeRanges(
            issuer.address,
            [
              {
                min: authorizedRanges[0].min,
                max: authorizedRanges[0].max + 1,
              },
              authorizedRanges[1],
            ],
            authorizedRangeIndexes
          )
        ).to.be.revertedWith(
          `IdsMismatch("${issuer.address}", ${authorizedRangeIndexes[0]}, ${
            authorizedRanges[0].min
          }, ${authorizedRanges[0].max}, ${authorizedRanges[0].min}, ${
            authorizedRanges[0].max + 1
          })`
        );
      });

      it('Should revert when the secondRangeFirstCollectionId mismatch the second collection min', async () => {
        await expect(
          attestationsRegistry.unauthorizeRanges(
            issuer.address,
            [
              authorizedRanges[0],
              {
                min: authorizedRanges[1].min - 1,
                max: authorizedRanges[1].max,
              },
            ],
            authorizedRangeIndexes
          )
        ).to.be.revertedWith(
          `IdsMismatch("${issuer.address}", 0, ${authorizedRanges[1].min}, ${
            authorizedRanges[1].max
          }, ${authorizedRanges[1].min - 1}, ${authorizedRanges[1].max})`
        );
      });

      it('Should revert when the secondRangeLastCollectionId mismatch the second collection max', async () => {
        await expect(
          attestationsRegistry.unauthorizeRanges(
            issuer.address,
            [
              authorizedRanges[0],
              {
                min: authorizedRanges[1].min,
                max: authorizedRanges[1].max + 1,
              },
            ],
            authorizedRangeIndexes
          )
        ).to.be.revertedWith(
          `IdsMismatch("${issuer.address}", 0, ${authorizedRanges[1].min}, ${
            authorizedRanges[1].max
          }, ${authorizedRanges[1].min}, ${authorizedRanges[1].max + 1})`
        );
      });

      it('Should unauthorize the ranges for the issuer', async () => {
        const unauthorizeIssuerRangesTransaction = await attestationsRegistry.unauthorizeRanges(
          issuer.address,
          authorizedRanges,
          authorizedRangeIndexes
        );

        // 1 - Checks that the transaction emitted the events
        // 1.1 - Checks that the transaction emitted the first event
        await expect(unauthorizeIssuerRangesTransaction)
          .to.emit(attestationsRegistry, 'IssuerUnauthorized')
          .withArgs(issuer.address, authorizedRanges[0].min, authorizedRanges[0].max);

        // 1.2 - Checks that the transaction emitted the second event
        await expect(unauthorizeIssuerRangesTransaction)
          .to.emit(attestationsRegistry, 'IssuerUnauthorized')
          .withArgs(issuer.address, authorizedRanges[1].min, authorizedRanges[1].max);

        // 2 - Checks that the issuer is authorized for the range
        // 2.1 - Checks that the issuer is authorized for the first range
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[0].min)).to
          .be.false;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[0].max)).to
          .be.false;

        // 2.2 - Checks that the issuer is authorized for the second range
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[1].min)).to
          .be.false;
        expect(await attestationsRegistry.isAuthorized(issuer.address, authorizedRanges[1].max)).to
          .be.false;
      });
    });
  });

  /*************************************************************************************/
  /*************************************** PAUSE ***************************************/
  /*************************************************************************************/
  describe('Pause', async () => {
    it('Should revert when the sender is not the owner of the contract', async () => {
      await expect(attestationsRegistry.connect(notOwner).pause()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });

    it('Should pause the contract', async () => {
      const pauseTransaction = await attestationsRegistry.pause();

      // 1 - Checks that the transaction emitted the event
      await expect(pauseTransaction)
        .to.emit(attestationsRegistry, 'Paused')
        .withArgs(deployer.address);

      expect(await attestationsRegistry.paused()).to.be.true;
    });

    it('Should revert when the contract is already paused', async () => {
      await expect(attestationsRegistry.pause()).to.be.revertedWith('Pausable: paused');
    });
  });

  /*************************************************************************************/
  /************************************** UNPAUSE **************************************/
  /*************************************************************************************/
  describe('Unpause', async () => {
    it('Should revert when the sender is not the owner of the contract', async () => {
      await expect(attestationsRegistry.connect(notOwner).unpause()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });

    it('Should unpause the contract', async () => {
      const unpauseTransaction = await attestationsRegistry.unpause();

      // 1 - Checks that the transaction emitted the event
      await expect(unpauseTransaction)
        .to.emit(attestationsRegistry, 'Unpaused')
        .withArgs(deployer.address);

      expect(await attestationsRegistry.paused()).to.be.false;
    });

    it('Should revert when the contract is already unpaused', async () => {
      await expect(attestationsRegistry.unpause()).to.be.revertedWith('Pausable: not paused');
    });
  });

  /*************************************************************************************/
  /******************************** TRANSFER OWNERSHIP *********************************/
  /*************************************************************************************/
  describe('Transfer ownership', () => {
    it('Should revert when the sender is not the current owner of the contract', async () => {
      await expect(
        attestationsRegistry.connect(notOwner).transferOwnership(notOwner.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should revert when the newOwner is a zero address', async () => {
      await expect(
        attestationsRegistry.transferOwnership(ethers.constants.AddressZero)
      ).to.be.revertedWith('Ownable: new owner is the zero address');
    });

    it('Should transfer the ownership', async () => {
      await expect(attestationsRegistry.transferOwnership(secondDeployer.address))
        .to.emit(attestationsRegistry, 'OwnershipTransferred')
        .withArgs(deployer.address, secondDeployer.address);
    });
  });

  /*************************************************************************************/
  /******************************** RENOUNCE OWNERSHIP *********************************/
  /*************************************************************************************/
  describe('Renounce ownership', () => {
    before(async () => {
      await attestationsRegistry.connect(secondDeployer).transferOwnership(deployer.address);
    });

    it('Should revert when the sender is not the current owner of the contract', async () => {
      await expect(attestationsRegistry.connect(notOwner).renounceOwnership()).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });

    it('Should renounce the ownership', async () => {
      await expect(attestationsRegistry.renounceOwnership())
        .to.emit(attestationsRegistry, 'OwnershipTransferred')
        .withArgs(deployer.address, ethers.constants.AddressZero);
    });
  });

  /***********************************************************************/
  /******************************** ATTRIBUTES *********************************/
  /***********************************************************************/

  describe('Attributes', async () => {
    let ATTRIBUTES = {
      CURATED: 1,
      SYBIL_RESISTANCE: 2,
      TEST_INSERTION: 10,
      NOT_CREATED: 50,
    };

    before(async () => {
      await evmRevert(hre, snapshotId);
    });

    describe('Attribute creation', async () => {
      it('Should revert when creating a new attribute as a non-owner', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .createNewAttribute(ATTRIBUTES.TEST_INSERTION, formatBytes32String('TEST_INSERTION'))
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert when creating new attributes as a non-owner', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .createNewAttributes(
              [ATTRIBUTES.TEST_INSERTION, ATTRIBUTES.CURATED],
              [formatBytes32String('TEST_INSERTION'), formatBytes32String('CURATED')]
            )
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert when creating new attributes with different arguments length', async () => {
        await expect(
          attestationsRegistry.connect(deployer).createNewAttributes(
            [ATTRIBUTES.TEST_INSERTION], // missing one argument
            [formatBytes32String('TEST_INSERTION'), formatBytes32String('CURATED')]
          )
        ).to.be.revertedWith('ArgsLengthDoesNotMatch()');
      });

      it('Should revert when creating a attribute with index > 63', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .createNewAttribute(64, formatBytes32String('ATTRIBUTE_OVERFLOW'))
        ).to.be.revertedWith('IndexOutOfBounds(64)');
      });

      it('Should revert when creating new attributes with index of one of them > 63', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .createNewAttributes(
              [ATTRIBUTES.CURATED, 64],
              [formatBytes32String('CURATED'), formatBytes32String('ATTRIBUTE_OVERFLOW')]
            )
        ).to.be.revertedWith('IndexOutOfBounds(64)');
      });

      it('Should create a new attribute as an owner', async () => {
        const attributeInserted = await attestationsRegistry
          .connect(deployer)
          .createNewAttribute(ATTRIBUTES.TEST_INSERTION, formatBytes32String('TEST_INSERTION'));

        await expect(attributeInserted)
          .to.emit(attestationsRegistry, 'NewAttributeCreated')
          .withArgs(ATTRIBUTES.TEST_INSERTION, formatBytes32String('TEST_INSERTION'));
      });

      it('Should revert when trying to create again a attribute for the same index', async () => {
        await expect(
          attestationsRegistry.createNewAttribute(
            ATTRIBUTES.TEST_INSERTION,
            formatBytes32String('OTHER ATTRIBUTE')
          )
        ).to.be.revertedWith('AttributeAlreadyExists(10)');
      });

      it('Should revert when creating new attributes with one of them already existing', async () => {
        await expect(
          attestationsRegistry.connect(deployer).createNewAttributes(
            [ATTRIBUTES.CURATED, ATTRIBUTES.TEST_INSERTION], // TEST_INSERTION already created
            [formatBytes32String('CURATED'), formatBytes32String('TEST_INSERTION')]
          )
        ).to.be.revertedWith('AttributeAlreadyExists(10)');
      });

      it('Should create new attributes as an owner', async () => {
        const attributesInserted = await attestationsRegistry
          .connect(deployer)
          .createNewAttributes(
            [ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE],
            [formatBytes32String('CURATED'), formatBytes32String('SYBIL_RESISTANCE')]
          );

        await expect(attributesInserted)
          .to.emit(attestationsRegistry, 'NewAttributeCreated')
          .withArgs(ATTRIBUTES.CURATED, formatBytes32String('CURATED'));

        await expect(attributesInserted)
          .to.emit(attestationsRegistry, 'NewAttributeCreated')
          .withArgs(ATTRIBUTES.SYBIL_RESISTANCE, formatBytes32String('SYBIL_RESISTANCE'));
      });
    });

    describe('Attribute update', async () => {
      it('Should revert when updating attribute as a non-owner', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .updateAttributeName(ATTRIBUTES.TEST_INSERTION, formatBytes32String('CURATED2'))
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert when updating attributes as a non-owner', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .updateAttributesName(
              [ATTRIBUTES.TEST_INSERTION, ATTRIBUTES.CURATED],
              [formatBytes32String('TEST_INSERTION2'), formatBytes32String('CURATED2')]
            )
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert when updating new attributes with different arguments length', async () => {
        await expect(
          attestationsRegistry.connect(deployer).updateAttributesName(
            [ATTRIBUTES.TEST_INSERTION], // missing one argument
            [formatBytes32String('TEST_INSERTION2'), formatBytes32String('CURATED2')]
          )
        ).to.be.revertedWith('ArgsLengthDoesNotMatch()');
      });

      it('Should revert when updating a attribute with index > 63', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .updateAttributeName(64, formatBytes32String('ATTRIBUTE_OVERFLOW'))
        ).to.be.revertedWith('IndexOutOfBounds(64)');
      });

      it('Should revert when updating new attributes with index of one of them > 63', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .updateAttributesName(
              [ATTRIBUTES.CURATED, 64],
              [formatBytes32String('CURATED2'), formatBytes32String('ATTRIBUTE_OVERFLOW')]
            )
        ).to.be.revertedWith('IndexOutOfBounds(64)');
      });

      it('Should revert when trying to update a attribute name that does not exists', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .updateAttributeName(ATTRIBUTES.NOT_CREATED, formatBytes32String('NOT_INSERTED'))
        ).to.be.revertedWith('AttributeDoesNotExist(50)');
      });

      it('Should revert when trying to update attributes name with one of them that does not exists', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .updateAttributesName(
              [ATTRIBUTES.CURATED, ATTRIBUTES.NOT_CREATED],
              [formatBytes32String('CURATED2'), formatBytes32String('NOT_INSERTED')]
            )
        ).to.be.revertedWith('AttributeDoesNotExist(50)');
      });

      it('Should update a attribute name', async () => {
        const attributeUpdated = await attestationsRegistry
          .connect(deployer)
          .updateAttributeName(ATTRIBUTES.TEST_INSERTION, formatBytes32String('TEST_INSERTION2'));

        await expect(attributeUpdated)
          .to.emit(attestationsRegistry, 'AttributeNameUpdated')
          .withArgs(
            ATTRIBUTES.TEST_INSERTION,
            formatBytes32String('TEST_INSERTION2'),
            formatBytes32String('TEST_INSERTION')
          );
      });

      it('Should update attributes name', async () => {
        const attributesUpdated = await attestationsRegistry
          .connect(deployer)
          .updateAttributesName(
            [ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE],
            [formatBytes32String('CURATED2'), formatBytes32String('SYBIL_RESISTANCE2')]
          );

        await expect(attributesUpdated)
          .to.emit(attestationsRegistry, 'AttributeNameUpdated')
          .withArgs(
            ATTRIBUTES.CURATED,
            formatBytes32String('CURATED2'),
            formatBytes32String('CURATED')
          );

        await expect(attributesUpdated)
          .to.emit(attestationsRegistry, 'AttributeNameUpdated')
          .withArgs(
            ATTRIBUTES.SYBIL_RESISTANCE,
            formatBytes32String('SYBIL_RESISTANCE2'),
            formatBytes32String('SYBIL_RESISTANCE')
          );
      });
    });

    describe('Attribute deletion', async () => {
      it('Should revert when deleting a attribute as a non-owner', async () => {
        await expect(
          attestationsRegistry.connect(notOwner).deleteAttribute(ATTRIBUTES.NOT_CREATED)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert when deleting attributes as a non-owner', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .deleteAttributes([ATTRIBUTES.NOT_CREATED, ATTRIBUTES.TEST_INSERTION])
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert when trying to delete a attribute with index > 63', async () => {
        await expect(attestationsRegistry.connect(deployer).deleteAttribute(64)).to.be.revertedWith(
          'IndexOutOfBounds(64)'
        );
      });

      it('Should revert when trying to delete attributes with index of one of them > 63', async () => {
        await expect(
          attestationsRegistry.connect(deployer).deleteAttributes([ATTRIBUTES.CURATED, 64])
        ).to.be.revertedWith('IndexOutOfBounds(64)');
      });

      it('Should revert when trying to delete a attribute that does not exists', async () => {
        await expect(
          attestationsRegistry.connect(deployer).deleteAttribute(ATTRIBUTES.NOT_CREATED)
        ).to.be.revertedWith('AttributeDoesNotExist(50)');
      });

      it('Should revert when trying to delete attributes with one of them that does not exists', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .deleteAttributes([ATTRIBUTES.CURATED, ATTRIBUTES.NOT_CREATED])
        ).to.be.revertedWith('AttributeDoesNotExist(50)');
      });

      it('Should delete a attribute', async () => {
        const attributeDeleted = await attestationsRegistry
          .connect(deployer)
          .deleteAttribute(ATTRIBUTES.TEST_INSERTION);
        await expect(attributeDeleted)
          .to.emit(attestationsRegistry, 'AttributeDeleted')
          .withArgs(ATTRIBUTES.TEST_INSERTION, formatBytes32String('TEST_INSERTION2'));
      });

      it('Should delete attributes', async () => {
        const attributesDeleted = await attestationsRegistry
          .connect(deployer)
          .deleteAttributes([ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE]);

        await expect(attributesDeleted)
          .to.emit(attestationsRegistry, 'AttributeDeleted')
          .withArgs(ATTRIBUTES.CURATED, formatBytes32String('CURATED2'));

        await expect(attributesDeleted)
          .to.emit(attestationsRegistry, 'AttributeDeleted')
          .withArgs(ATTRIBUTES.SYBIL_RESISTANCE, formatBytes32String('SYBIL_RESISTANCE2'));
      });
    });

    describe('Create AttestationsCollection Attributes', async () => {
      before(async () => {
        // Register the attribute we will use during the tests
        await attestationsRegistry
          .connect(deployer)
          .createNewAttributes(
            [ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE],
            [formatBytes32String('CURATED'), formatBytes32String('SYBIL_RESISTANCE')]
          );
      });

      it('Should revert when setting a attribute as a non-owner', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .setAttributeValueForAttestationsCollection(1, ATTRIBUTES.CURATED, 1)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert when setting attributes as a non-owner', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .setAttributesValuesForAttestationsCollections(
              [1, 1],
              [ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE],
              [1, 2]
            )
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should revert when setting attributes with invalid args length', async () => {
        await expect(
          attestationsRegistry.connect(deployer).setAttributesValuesForAttestationsCollections(
            [1], //missing arg
            [ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE],
            [1, 2]
          )
        ).to.be.revertedWith('ArgsLengthDoesNotMatch');
      });

      it('Should revert when setting a attribute with an index > 63', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .setAttributeValueForAttestationsCollection(1, 64, 1)
        ).to.be.revertedWith('IndexOutOfBounds(64)');
      });

      it('Should revert when setting attributes with one of them having an index > 63', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .setAttributesValuesForAttestationsCollections([1, 1], [ATTRIBUTES.CURATED, 64], [1, 2])
        ).to.be.revertedWith('IndexOutOfBounds(64)');
      });

      it('Should revert when setting a attribute to an AttestationsCollection and the attribute is not already created', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .setAttributeValueForAttestationsCollection(1, ATTRIBUTES.NOT_CREATED, 1)
        ).to.be.revertedWith('AttributeDoesNotExist(50)');
      });

      it('Should revert when setting attributes to an AttestationsCollection and one of the attributes is not already created', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .setAttributesValuesForAttestationsCollections(
              [1, 1],
              [ATTRIBUTES.CURATED, ATTRIBUTES.NOT_CREATED],
              [1, 2]
            )
        ).to.be.revertedWith('AttributeDoesNotExist(50)');
      });

      it('Should set a attribute to an AttestationsCollection with power 1', async () => {
        const attributeSet = await attestationsRegistry
          .connect(deployer)
          .setAttributeValueForAttestationsCollection(1, ATTRIBUTES.CURATED, 1);

        await expect(attributeSet)
          .to.emit(attestationsRegistry, 'AttestationsCollectionAttributeSet')
          .withArgs(1, ATTRIBUTES.CURATED, 1);

        expect(await attestationsRegistry.attestationsCollectionHasAttribute(1, ATTRIBUTES.CURATED))
          .to.be.true;
        expect(
          await attestationsRegistry.getAttributeValueForAttestationsCollection(
            1,
            ATTRIBUTES.CURATED
          )
        ).to.be.eq(1);
      });

      it('Should set a attribute to an AttestationsCollection and change the power', async () => {
        const attributeSet = await attestationsRegistry
          .connect(deployer)
          .setAttributeValueForAttestationsCollection(1, ATTRIBUTES.CURATED, 5);

        await expect(attributeSet)
          .to.emit(attestationsRegistry, 'AttestationsCollectionAttributeSet')
          .withArgs(1, ATTRIBUTES.CURATED, 5);

        expect(await attestationsRegistry.attestationsCollectionHasAttribute(1, ATTRIBUTES.CURATED))
          .to.be.true;
        expect(
          await attestationsRegistry.getAttributeValueForAttestationsCollection(
            1,
            ATTRIBUTES.CURATED
          )
        ).to.be.eq(5);
      });

      it('Should revert to set a attribute to an AttestationsCollection with power > 15', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .setAttributeValueForAttestationsCollection(1, ATTRIBUTES.CURATED, 16)
        ).to.be.revertedWith('ValueOutOfBounds(16)');
      });

      it('Should revert when removing a attribute as a non-owner', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .setAttributeValueForAttestationsCollection(1, ATTRIBUTES.CURATED, 0)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should remove attribute to an AttestationsCollection', async () => {
        const attributeRemoved = await attestationsRegistry
          .connect(deployer)
          .setAttributeValueForAttestationsCollection(1, ATTRIBUTES.CURATED, 0);

        await expect(attributeRemoved)
          .to.emit(attestationsRegistry, 'AttestationsCollectionAttributeSet')
          .withArgs(1, ATTRIBUTES.CURATED, 0);

        expect(await attestationsRegistry.attestationsCollectionHasAttribute(1, ATTRIBUTES.CURATED))
          .to.be.false;
        expect(
          await attestationsRegistry.getAttributeValueForAttestationsCollection(
            1,
            ATTRIBUTES.CURATED
          )
        ).to.be.eq(0);
      });

      it('Should set attributes to two AttestationsCollection with power 1 and 2', async () => {
        const attributesSet = await attestationsRegistry
          .connect(deployer)
          .setAttributesValuesForAttestationsCollections(
            [1, 1],
            [ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE],
            [1, 2]
          );

        await expect(attributesSet)
          .to.emit(attestationsRegistry, 'AttestationsCollectionAttributeSet')
          .withArgs(1, ATTRIBUTES.CURATED, 1);

        await expect(attributesSet)
          .to.emit(attestationsRegistry, 'AttestationsCollectionAttributeSet')
          .withArgs(1, ATTRIBUTES.SYBIL_RESISTANCE, 2);

        expect(
          await attestationsRegistry.attestationsCollectionHasAttributes(1, [
            ATTRIBUTES.CURATED,
            ATTRIBUTES.SYBIL_RESISTANCE,
          ])
        ).to.be.true;

        expect(
          await attestationsRegistry.getAttributesValuesForAttestationsCollection(1, [
            ATTRIBUTES.CURATED,
            ATTRIBUTES.SYBIL_RESISTANCE,
          ])
        ).to.be.eql([1, 2]);
      });

      it('Should set attributes to AttestationsCollection and change the power', async () => {
        const attributesSet = await attestationsRegistry
          .connect(deployer)
          .setAttributesValuesForAttestationsCollections(
            [1, 1],
            [ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE],
            [6, 11]
          );

        await expect(attributesSet)
          .to.emit(attestationsRegistry, 'AttestationsCollectionAttributeSet')
          .withArgs(1, ATTRIBUTES.CURATED, 6);

        await expect(attributesSet)
          .to.emit(attestationsRegistry, 'AttestationsCollectionAttributeSet')
          .withArgs(1, ATTRIBUTES.SYBIL_RESISTANCE, 11);

        expect(
          await attestationsRegistry.attestationsCollectionHasAttributes(1, [
            ATTRIBUTES.CURATED,
            ATTRIBUTES.SYBIL_RESISTANCE,
          ])
        ).to.be.true;
        expect(
          await attestationsRegistry.getAttributesValuesForAttestationsCollection(1, [
            ATTRIBUTES.CURATED,
            ATTRIBUTES.SYBIL_RESISTANCE,
          ])
        ).to.be.eql([6, 11]);
      });

      it('Should get attributes names and values for the attestationsCollection referenced', async () => {
        const res = await attestationsRegistry
          .connect(deployer)
          .getAttributesNamesAndValuesForAttestationsCollection(1);

        // we should have only 2 attributes enabled
        expect(res[0].length).to.be.eql(2);
        expect(parseBytes32String(res[0][0])).to.be.eql('CURATED');
        expect(parseBytes32String(res[0][1])).to.be.eql('SYBIL_RESISTANCE');
        expect(res[1]).to.be.eql([6, 11]);
      });

      it('Should revert to set attributes to an AttestationsCollection with one of them having a power > 15', async () => {
        await expect(
          attestationsRegistry
            .connect(deployer)
            .setAttributesValuesForAttestationsCollections(
              [1, 1],
              [ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE],
              [6, 16]
            )
        ).to.be.revertedWith('ValueOutOfBounds(16)');
      });

      it('Should revert when removing attributes as a non-owner', async () => {
        await expect(
          attestationsRegistry
            .connect(notOwner)
            .setAttributesValuesForAttestationsCollections(
              [1, 1],
              [ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE],
              [0, 0]
            )
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('Should remove attributes to an AttestationsCollection', async () => {
        const attributesRemoved = await attestationsRegistry
          .connect(deployer)
          .setAttributesValuesForAttestationsCollections(
            [1, 1],
            [ATTRIBUTES.CURATED, ATTRIBUTES.SYBIL_RESISTANCE],
            [0, 0]
          );

        await expect(attributesRemoved)
          .to.emit(attestationsRegistry, 'AttestationsCollectionAttributeSet')
          .withArgs(1, ATTRIBUTES.CURATED, 0);

        await expect(attributesRemoved)
          .to.emit(attestationsRegistry, 'AttestationsCollectionAttributeSet')
          .withArgs(1, ATTRIBUTES.SYBIL_RESISTANCE, 0);

        expect(
          await attestationsRegistry.attestationsCollectionHasAttributes(1, [
            ATTRIBUTES.CURATED,
            ATTRIBUTES.SYBIL_RESISTANCE,
          ])
        ).to.be.false;

        expect(
          await attestationsRegistry.getAttributesValuesForAttestationsCollection(1, [
            ATTRIBUTES.CURATED,
            ATTRIBUTES.SYBIL_RESISTANCE,
          ])
        ).to.be.eql([0, 0]);
      });
    });
  });

  describe('Update Implementation', () => {
    it('Should update implementation', async () => {
      const proxyAdminSigner = await ethers.getSigner(
        deploymentsConfig[hre.network.name].deployOptions.proxyAdmin as string
      );
      const { attestationsRegistry: newImplementation } = await hre.run(
        'deploy-attestations-registry',
        {
          badges: secondDeployer.address,
          owner: secondDeployer.address,
          options: { behindProxy: false },
        }
      );
      const attestationsRegistryProxy = TransparentUpgradeableProxy__factory.connect(
        attestationsRegistry.address,
        proxyAdminSigner
      );
      await (await attestationsRegistryProxy.upgradeTo(newImplementation.address)).wait();

      const implementationAddress = await getImplementation(attestationsRegistryProxy);
      expect(implementationAddress).to.be.eql(newImplementation.address);
    });
  });
});
