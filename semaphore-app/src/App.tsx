import { useState, useEffect } from "react";
import contractABI from "./GreeterABI.json";
import attesterABI from "./AttesterABI.json";
import "./App.css";
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof, packToSolidityProof } from "@semaphore-protocol/proof";

const Web3js = require("web3");
const ethers = require("ethers");

const contractAddress = "0x4EE6eCAD1c2Dae9f525404De8555724e3c35d07B";
const attesterAddress = "0x2B0d36FACD61B71CC05ab8F3D2355ec3631C0dd5";

function App() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [web3, setWeb3] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [attester, setAttester] = useState<any>(null);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_requestAccounts" });
      let web3_;
      if (!contract) {
        web3_ = new Web3js(window.ethereum);
        setWeb3(web3_);
        setContract(new web3_.eth.Contract(contractABI, contractAddress));
        setAttester(new web3_.eth.Contract(attesterABI, attesterAddress));
      }
    }
  }, [contract]);

  async function createIdentity() {
    const identity = new Identity();
    setIdentity(identity);
  }

  async function joinGroup() {
    try {
      if (!identity) return;
      await contract.methods
        .joinGroup(identity.generateCommitment())
        .send({ from: window.ethereum.selectedAddress });
      console.log("nice");
    } catch (err) {
      console.log(err);
    }
  }

  async function vote() {
    if (!identity) return;

    console.log(contract);
    const groupTemp = new Group();
    const users = await contract.methods
      .getCommitments()
      .call({ from: window.ethereum.selectedAddress });
    console.log("user -> ", users);
    const groupId = await contract.methods
      .groupId()
      .call({ from: window.ethereum.selectedAddress });
    console.log("groupId -> ", users);
    console.log(users, groupId);
    groupTemp.addMembers(users);

    const greeting = ethers.utils.formatBytes32String("Hello World");

    const proof = await generateProof(identity, groupTemp, groupId, greeting);
    const solidityProof = packToSolidityProof(proof.proof);

    console.log("great", greeting);
    console.log(
      greeting,
      " , ",
      proof.publicSignals.merkleRoot,
      " , ",
      proof.publicSignals.nullifierHash,
      " , ",
      solidityProof
    );
    const rec = await contract.methods
      .vote(
        web3.eth.abi.encodeParameter(
          {
            SemaphoreProof: {
              signal: "uint256",
              merkleTreeRoot: "uint256",
              nullifierHash: "uint256",
              externalNullifierHash: "uint256",
              groupId: "uint256",
              contractAddress: "address",
            },
          },
          {
            signal: greeting,
            merkleTreeRoot: proof.publicSignals.merkleRoot,
            nullifierHash: proof.publicSignals.nullifierHash,
            externalNullifierHash: 0,
            groupId: 42,
            contractAddress:
              "0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575",
          }
        ),
        web3.eth.abi.encodeParameter("uint256[8]", solidityProof)
      )
      .send({ from: window.ethereum.selectedAddress });
    console.log(rec);
  }

  async function getAttesttation() {
    if (!identity) return;

    const groupTemp = new Group();
    const users = await contract.methods
      .getCommitments()
      .call({ from: window.ethereum.selectedAddress });
    const groupId = await contract.methods
      .groupId()
      .call({ from: window.ethereum.selectedAddress });
    console.log("user -> ", users, "  groupId ----> ", groupId);
    groupTemp.addMembers(users);

    const greeting = ethers.utils.formatBytes32String("Hello World");

    const proof = await generateProof(identity, groupTemp, groupId, greeting);
    const solidityProof = packToSolidityProof(proof.proof);

    console.log("great", greeting);
    console.log(
      greeting,
      " , ",
      proof.publicSignals.merkleRoot,
      " , ",
      proof.publicSignals.nullifierHash,
      " , ",
      solidityProof
    );

    try {
      const rec = await attester.methods
        .generateAttestations(
          {
            claims: [
              {
                groupId: 42,
                claimedValue: 2,
                extraData: web3.eth.abi.encodeParameter(
                  {
                    SemaphoreProof: {
                      signal: "uint256",
                      merkleTreeRoot: "uint256",
                      nullifierHash: "uint256",
                      externalNullifierHash: "uint256",
                      groupId: "uint256",
                      contractAddress: "address",
                    },
                  },
                  {
                    signal: greeting,
                    merkleTreeRoot: proof.publicSignals.merkleRoot,
                    nullifierHash: proof.publicSignals.nullifierHash,
                    externalNullifierHash: 0,
                    groupId: 42,
                    contractAddress:
                      "0x4EE6eCAD1c2Dae9f525404De8555724e3c35d07B",
                  }
                ),
              },
            ],
            destination: "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
          },
          web3.eth.abi.encodeParameter("uint256[8]", solidityProof)
        )
        .send({ from: window.ethereum.selectedAddress });
      console.log("Badge ---> ", rec);
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <div className="App">
      <header className="App-header">
        <button onClick={createIdentity}>Create Identity</button>
        {identity && (
          <p style={{ width: "50vh", fontSize: "12px" }}>
            {(identity as any).toString()}
          </p>
        )}
        <button onClick={joinGroup}>Join group</button>
        <button onClick={vote}>vote</button>
        <button onClick={getAttesttation}>SISMOOOO</button>
      </header>
    </div>
  );
}

export default App;
