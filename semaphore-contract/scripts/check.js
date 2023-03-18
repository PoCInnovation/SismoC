import ethers from "hardhat";

async function main() {
    const Voter = await ethers.getContractFactory("Voter");
    const voter = await Voter.attach("0x8a791620dd6260079bf849dc5567adc3f2fdc318");

    const res = await voter.users(BigInt(9683113455773589102710029920191528816544078179188582354099357132058060419741));
    console.log(res);
  }

  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });