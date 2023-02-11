// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();

  console.log("Owner address ", owner.address)

  let collectionIdFirst = 10_000;
  let collectionIdLast = 20_000;

  //Deploy Attester
  const Attester = await hre.ethers.getContractFactory('SemaphoreAttester');
  const attester = await Attester.attach("0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf")

  attester.bindSemaphoreGroup("0x976EA74026E726554dB657fA54763abd0C3a0aa9", 42);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
