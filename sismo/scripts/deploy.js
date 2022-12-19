// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  let attestationsRegistryAddress = "";
  let collectionIdFirst = 10_000;
  let collectionIdLast = 20_000;
  // const Attester = await hre.ethers.getContractFactory("AttesterERC20");
  const Attester = await hre.ethers.getContractFactory('../sismo-protocol-main/contracts/core/Badges.sol');
  const attester = await Attester.deploy(attestationsRegistryAddress, collectionIdFirst, collectionIdLast);

  await attester.deployed();

  console.log(
    `Attester deployed to ${attester.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
