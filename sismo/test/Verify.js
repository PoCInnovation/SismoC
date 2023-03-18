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
    const badges = await Badges.attach("0xD0141E899a65C95a556fE2B27e5982A6DE7fDD7A");
    // await badges.deployed();
    console.log(`Badges deployed to ${badges.address}`);

    const res = await badges.balanceOf("0xBcd4042DE499D14e55001CcbB24a551F3b954096", 10001)
    console.log(res);
    expect(res).to.equal(2);
  });
});
