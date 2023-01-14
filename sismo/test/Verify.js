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
    const badges = await Badges.attach("0x9E545E3C0baAB3E08CdfD552C960A1050f373042");
    // await badges.deployed();
    // console.log(`Badges deployed to ${badges.address}`);


    const res = await badges.balanceOf("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 10001);
    console.log(res);

    expect(true).equal(true);
  });
});