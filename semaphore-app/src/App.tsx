import { useState, useEffect } from 'react';
import jsonSema from './semaphore.json';
import contractABI from './GreeterABI.json';
import './App.css';
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof, verifyProof, packToSolidityProof } from "@semaphore-protocol/proof"

const Web3js = require("web3");
const ethers = require("ethers");

const verificationKey = jsonSema

const contractAbi = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "identityCommitment",
				"type": "uint256"
			}
		],
		"name": "joinGroup",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "semaphoreAddress",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_groupId",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "identityCommitment",
				"type": "uint256"
			}
		],
		"name": "NewUser",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "vote",
				"type": "bytes32"
			}
		],
		"name": "NewVote",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "myVote",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "merkleTreeRoot",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "nullifierHash",
				"type": "uint256"
			},
			{
				"internalType": "uint256[8]",
				"name": "proof",
				"type": "uint256[8]"
			}
		],
		"name": "vote",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCommitments",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "groupId",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "semaphore",
		"outputs": [
			{
				"internalType": "contract ISemaphore",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

const contractAddress = "0x322813fd9a801c5507c9de605d63cea4f2ce6c44"


function App() {
  
  const [identity, setIdentity] = useState(null)
  const [web3, setWeb3] = useState(null)
  const [contract, setContract] = useState(null)
  
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
    // @ts-ignore
    setIdentity(identity)
  }

  async function joinGroup() {

    // @ts-ignore
    console.log(identity.generateCommitment());

    try {
      // @ts-ignore
      await contract.methods.joinGroup(identity.generateCommitment()).send({ from: window.ethereum.selectedAddress })
      console.log("nice")
    } catch (err) {
      console.log(err)
    }
  }

  async function vote() {
    const groupTemp = new Group()
    // @ts-ignore
    const users = await contract.methods.getCommitments().call({ from: window.ethereum.selectedAddress })
    // @ts-ignore
    const groupId = await contract.methods.groupId().call({ from: window.ethereum.selectedAddress })
    console.log(users, groupId)
    groupTemp.addMembers(users)

    // @ts-ignore
    const data = web3.utils.asciiToHex("Hello World")
	const greeting = ethers.utils.formatBytes32String("Hello World")

  // @ts-ignore
    const proof = await generateProof(identity, groupTemp, groupId, greeting)
    const solidityProof = packToSolidityProof(proof.proof)

    verifyProof(verificationKey, proof).then((result) => {
        // console.log("here", result)
    }) //local verification
	console.log("great", greeting)
	console.log(greeting, " , ", proof.publicSignals.merkleRoot, " , ", proof.publicSignals.nullifierHash, " , ", solidityProof)
  // @ts-ignore
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
