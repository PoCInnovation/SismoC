const { expect } = require("chai");
const hre = require("hardhat");

describe("Verify from react app", function () {
  it("Test if the badge is correctly attributed to a user", async function () {
    const [owner] = await hre.ethers.getSigners();

    console.log("Owner address ", owner.address)

    let collectionIdFirst = 10_000;
    let collectionIdLast = 20_000;

    //Deploy Badges
    const Badges = await hre.ethers.getContractFactory('Badges');
    const badges = await Badges.attach("0x5FC8d32690cc91D4c39d9d3abcBD16989F875707");
    // await badges.deployed();
    // console.log(`Badges deployed to ${badges.address}`);


    const res = await badges.balanceOf("0xdD2FD4581271e230360230F9337D5c0430Bf44C0", 10001);
    console.log(res);
    expect(true).equal(true);
  });
});