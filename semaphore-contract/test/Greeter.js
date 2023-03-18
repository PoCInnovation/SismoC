const { Identity } = require("@semaphore-protocol/identity")
const { Group } = require("@semaphore-protocol/group")
const { generateProof, packToSolidityProof, verifyProof } = require("@semaphore-protocol/proof")
const { expect } = require("chai")
const { run, ethers } = require("hardhat")

describe("Greeter", function () {
    let greeter

    const users = []
    const groupId = 42
    const group = new Group()

    before(async () => {
        greeter = await run("deploy", { logs: false, group: groupId })

        users.push({
            identity: new Identity(),
            username: ethers.utils.formatBytes32String("anon1")
        })

        users.push({
            identity: new Identity(),
            username: ethers.utils.formatBytes32String("anon2")
        })

        group.addMember(users[0].identity.generateCommitment())
        group.addMember(users[1].identity.generateCommitment())
    })

    describe("# joinGroup", () => {
        it("Should allow users to join the group", async () => {
            for (let i = 0; i < group.members.length; i++) {
                const transaction = greeter.joinGroup(group.members[i], users[i].username)

                await expect(transaction).to.emit(greeter, "NewUser").withArgs(group.members[i], users[i].username)
            }
        })
    })

    describe("# greet", () => {
        const wasmFilePath = "./static/semaphore.wasm"
        const zkeyFilePath = "./static/semaphore.zkey"

        it("Should allow users to greet", async () => {
            const greeting = ethers.utils.formatBytes32String("Hello World")

            const fullProof = await generateProof(users[1].identity, group, groupId, greeting, {
                wasmFilePath,
                zkeyFilePath
            })
            const solidityProof = packToSolidityProof(fullProof.proof)

            const transaction = greeter.greet(
                greeting,
                fullProof.publicSignals.merkleRoot,
                fullProof.publicSignals.nullifierHash,
                solidityProof
            )

            await expect(transaction).to.emit(greeter, "NewGreeting").withArgs(greeting)
        })
    })
})