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
  // await attester.connect(owner).addGroup(token.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
