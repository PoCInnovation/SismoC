const { expect } = require("chai");
var Web3 = require('web3')

var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
describe("Attester", function () {
  it("test attester", async () => {
    const [owner] = await ethers.getSigners();

    console.log("Owner address ", owner.address)

    let collectionIdFirst = 10_000;
    let collectionIdLast = 20_000;

    const Attester = await hre.ethers.getContractFactory('MyAttester');
    const attester = await Attester.deploy(owner.address, collectionIdFirst, collectionIdLast);
    
    
    console.log(await attester.balanceOf(owner.address))

    await attester.connect(owner).mint(owner.address, 13);

    console.log(await attester.connect(owner).balanceOf(owner.address))

    const request = {
      claims: [
        {
          groupId: 1,
          claimedValue: 13,
          extraData: 0,
        }
      ],
      destination: owner.address,
    }

    let test = web3.utils.hexToBytes('0x000000ea');

    const tx = await attester.connect(owner).generateAttestations(request, test);
    const { events } = await tx.wait();
    console.log(events)
    
    // await expect(proof).to.be.not.revertedWith("not enough money");
  });
});