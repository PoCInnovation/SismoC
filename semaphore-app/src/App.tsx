import { useState, useEffect } from 'react';
import jsonSema from './semaphore.json';
import contractABI from './GreeterABI.json';
import './App.css';
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof, verifyProof, packToSolidityProof } from "@semaphore-protocol/proof"

const Web3js = require("web3");
const ethers = require("ethers");

const contractAddress = "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9"

function App() {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [web3, setWeb3] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_requestAccounts" })
      let web3_;
      if (!contract) {
        web3_ = new Web3js(window.ethereum);
        setWeb3(web3_);
        setContract(new web3_.eth.Contract(contractABI, contractAddress));
      }
    }
  }, [])

  async function createIdentity() {
    const identity = new Identity()
    setIdentity(identity)
  }

  async function joinGroup() {
    try {
	  if (!identity) return;
      await contract.methods.joinGroup(identity.generateCommitment()).send({ from: window.ethereum.selectedAddress })
      console.log("nice")
    } catch (err) {
      console.log(err)
    }
  }

  async function vote() {
	if (!identity) return;

    const groupTemp = new Group()
    const users = await contract.methods.getCommitments().call({ from: window.ethereum.selectedAddress })
    const groupId = await contract.methods.groupId().call({ from: window.ethereum.selectedAddress })
    console.log(users, groupId)
    groupTemp.addMembers(users)

	const greeting = ethers.utils.formatBytes32String("Hello World")

    const proof = await generateProof(identity, groupTemp, groupId, greeting)
    const solidityProof = packToSolidityProof(proof.proof)

	console.log("great", greeting)
	console.log(greeting, " , ", proof.publicSignals.merkleRoot, " , ", proof.publicSignals.nullifierHash, " , ", solidityProof)
	const rec = await contract.methods.vote(greeting, proof.publicSignals.merkleRoot, proof.publicSignals.nullifierHash, solidityProof).send({ from: window.ethereum.selectedAddress })
    console.log(rec)
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={createIdentity}>Create Identity</button>
        {identity && <p style={{width: "50vh", fontSize: "12px"}}>{(identity as any).toString()}</p>}
        <button onClick={joinGroup}>Join group</button>
        <button onClick={vote}>Vote</button>
      </header>
    </div>
  );
}

export default App;
