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
    const badges = await Badges.attach("0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00");
    // await badges.deployed();
    console.log(`Badges deployed to ${badges.address}`);

    const res = await badges.balanceOf("0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", 10_001);
    console.log(res);
    expect(res).to.equal(2);
  });
});
