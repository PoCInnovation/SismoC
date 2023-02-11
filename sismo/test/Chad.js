const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

describe("Create badge/attestation", function () {
  it("Test if the badge is correctly attributed to a user", async function () {
    const [owner] = await hre.ethers.getSigners();

    console.log("Owner address ", owner.address)

    let collectionIdFirst = 10_000;
    let collectionIdLast = 20_000;

    //Deploy Badges
    const Badges = await hre.ethers.getContractFactory('Badges');
    const badges = await Badges.deploy("", owner.address);
    await badges.deployed();
    console.log(`Badges deployed to ${badges.address}`);

    //Deploy Registry
    const Registry = await hre.ethers.getContractFactory('AttestationsRegistry');
    const registry = await Registry.deploy(owner.address, badges.address);
    await registry.deployed();
    console.log(`Registry deployed to ${registry.address}`);

    //Deploy Attester
    const Attester = await hre.ethers.getContractFactory('SemaphoreAttester');
    const attester = await Attester.deploy(owner.address, registry.address, collectionIdFirst, collectionIdLast);
    await attester.deployed();
    console.log(`Attester deployed to ${attester.address}`);

    //Deploy Token
    // const Token = await hre.ethers.getContractFactory('myERC20');
    // const token = await Token.deploy(owner.address, "IsmaToken", "ISMA");
    // await token.deployed();
    // console.log(`Token deployed to ${token.address}`);

    //Set up Roles / group id
    even_trigger_role = await badges.connect(owner).EVENT_TRIGGERER_ROLE();
    await badges.connect(owner).grantRole(even_trigger_role, registry.address);
    await badges.connect(owner).setAttestationsRegistry(registry.address);
    await registry.connect(owner).authorizeRange(attester.address, collectionIdFirst, collectionIdLast);
    // await attester.connect(owner).addGroup(42);

    attester.bindSemaphoreGroup("0x0165878A594ca255338adfa4d48449f69242Eb8F", 42);

    const request = {
        claims: [
            {
              groupId: 42,
              claimedValue: 2,
              extraData: 0,
            }
        ],
        destination: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    }
    attester.connect(owner).generateAttestations(request, 0);

    expect(await badges.connect(owner).balanceOf(owner.address, 10_001)).to.equal(2);

    console.log("=====end======");
  });
});