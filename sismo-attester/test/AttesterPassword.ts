import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("AttesterPassword", function () {
    async function deployAttesterPasswordFixture() {
        const collectionIdFirst = 10000;
        const collectionIdLast = 10001;

        const [owner, otherAccount] = await ethers.getSigners();

        const Badges = await ethers.getContractFactory("Badges");
        const badges = await Badges.deploy("", owner.address);

        const Registry = await ethers.getContractFactory("AttestationRegistry");
        const registry = await Registry.deploy(owner.address, badges.address);

        const AttesterPassword = await ethers.getContractFactory("AttesterPassword");
        const attester = await AttesterPassword.deploy(owner.address, registry.address, collectionIdFirst, collectionIdLast);

        return { badges, registry, attester, owner, otherAccount };
    }

    describe("Deployement", function () {
        
    })
})
