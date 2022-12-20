// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const ownerWallet = "0xdE8Cd88AcF910A8fDbE9936Cb68cB23F5a96157c";
  let attestationsRegistryAddress = "";
  let collectionIdFirst = 10_000;
  let collectionIdLast = 20_000;
  // const Attester = await hre.ethers.getContractFactory("AttesterERC20");
  // const attester = await Attester.deploy(attestationsRegistryAddress, collectionIdFirst, collectionIdLast);
  const Badges = await hre.ethers.getContractFactory('Badges');
  const badges = await Badges.deploy("", ownerWallet);
  await badges.deployed();
  console.log(`Badges deployed to ${badges.address}`);

  const Registry = await hre.ethers.getContractFactory('AttestationsRegistry');
  const registry = await Registry.deploy(ownerWallet, badges.address);
  await registry.deployed();
  console.log(`Registry deployed to ${registry.address}`);

  const Attester = await hre.ethers.getContractFactory('AttesterERC20');
  const attester = await Attester.deploy(ownerWallet, registry.address, collectionIdFirst, collectionIdLast);
  await attester.deployed();
  console.log(`Attester deployed to ${attester.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
