import { useState, useEffect } from "react";
import contractABI from "./GreeterABI.json";
import attesterABI from "./AttesterABI.json";
import "./App.css";
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof, packToSolidityProof } from "@semaphore-protocol/proof";

const Web3js = require("web3");
const ethers = require("ethers");

const contractAddress = process.env.REACT_APP_GREETER_ADDRESS || "";
const attesterAddress = process.env.REACT_APP_ATTESTER_ADDRESS || "";

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

      const groupTemp = new Group()
      const users = await contract.methods.getCommitments().call({ from: window.ethereum.selectedAddress })
      const groupId = await contract.methods.groupId().call({ from: window.ethereum.selectedAddress })
      groupTemp.addMembers(users)

      const greeting = ethers.utils.formatBytes32String("Hello World")

      const proof = await generateProof(identity, groupTemp, groupId, greeting)
      const solidityProof = packToSolidityProof(proof.proof)

    const rec = await contract.methods.vote(greeting, proof.publicSignals.merkleRoot, proof.publicSignals.nullifierHash, solidityProof).send({ from: window.ethereum.selectedAddress });
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
    groupTemp.addMembers(users);

    const greeting = ethers.utils.formatBytes32String("Hello World");

    const proof = await generateProof(identity, groupTemp, groupId, greeting);
    const solidityProof = packToSolidityProof(proof.proof);

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
                    contractAddress: process.env.REACT_APP_SEMAPHORE_ADDRESS || "",
                  }
                ),
              },
            ],
            destination: process.env.REACT_APP_DESTINATION_ADDRESS || "",
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
          <button onClick={getAttesttation}>Generate attestation</button>
        <button onClick={vote}>vote</button>
      </header>
    </div>
  );
}

export default App;
