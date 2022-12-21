import { ethers } from "hardhat";

async function main() {
  const ownerWallet = "0x0a2d9f43FFC1bA1d656A76faa370bE83E428a175";
  const collectionIdFirst = 10000;
  const collectionIdLast = 10001;

  /**
   * Deploy Badges sismo contracts
   */
  const Badges = await ethers.getContractFactory("Badges");
  const badges = await Badges.deploy("", ownerWallet);
  await badges.deployed();
  console.log(`Badges deployed to ${badges.address}`);

  /**
   * Deploy AttestationRegistry sismo contract
   */
  const Registry = await ethers.getContractFactory("AttestationRegistry");
  const registry = await Registry.deploy(ownerWallet, badges.address);
  await registry.deployed();
  console.log(`Registry deployted to ${registry.address}`);

  /**
   * Deploy AttesterPassword contract
   */
  const AttesterPassword = await ethers.getContractFactory("AttesterPassword");
  const attester = await AttesterPassword.deploy();
  await attester.deployed();
  console.log(`AttesterPassword deployed to ${attester.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
