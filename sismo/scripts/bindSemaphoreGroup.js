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
  const attester = await Attester.attach("0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8")

  attester.bindSemaphoreGroup("0x8A791620dd6260079BF849Dc5567aDC3F2FdC318", 42);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
