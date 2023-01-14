import { useState, useEffect } from 'react';
import jsonSema from './semaphore.json';
import contractABI from './GreeterABI.json';
import attesterABI from './AttesterABI.json';
import './App.css';
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof, verifyProof, packToSolidityProof } from "@semaphore-protocol/proof"

const Web3js = require("web3");
const ethers = require("ethers");

const contractAddress = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
const attesterAddress = "0x1613beB3B2C4f22Ee086B2b38C1476A3cE7f78E8"

function App() {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [web3, setWeb3] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)
  const [attester, setAttester] = useState<any>(null)

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_requestAccounts" })
      let web3_;
      if (!contract) {
        web3_ = new Web3js(window.ethereum);
        setWeb3(web3_);
        setContract(new web3_.eth.Contract(contractABI, contractAddress));
        setAttester(new web3_.eth.Contract(attesterABI, attesterAddress));
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

  async function getAttesttation() {
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
    // const rec = await contract.methods.vote(greeting, proof.publicSignals.merkleRoot, proof.publicSignals.nullifierHash, solidityProof).send({ from: window.ethereum.selectedAddress })
    // bytes32 signal;
    // uint256 merkleTreeRoot;
    // uint256 nullifierHash;
    // uint256 externalNullifier;
    // uint256 groupId;
    // address contractAddress;  
    const rec = await attester.methods.generateAttestations(
        {
          destination: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          claims: [
            {
              groupId: 42,
              claimedValue: 2,
              extraData: {
                signal: greeting,
                merkleTreeRoot: proof.publicSignals.merkleRoot,
                nullifierHash: proof.publicSignals.nullifierHash,
                externalNullifierHash: '',
                groupId: 42,
                contractAddress: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
              }
            }
          ]
        },
        solidityProof,
      )
    console.log(rec)
    }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={createIdentity}>Create Identity</button>
        {identity && <p style={{width: "50vh", fontSize: "12px"}}>{(identity as any).toString()}</p>}
        <button onClick={joinGroup}>Join group</button>
        <button onClick={vote}>vote</button>
        <button onClick={getAttesttation}>SISMOOOO</button>
      </header>
    </div>
  );
}

export default App;
