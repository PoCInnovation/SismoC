import { useState } from 'react';
import Web3 from 'web3';
import { ethers, utils } from 'ethers';
import contractABI from './GreeterABI.json';
import { Identity } from '@semaphore-protocol/identity'
import { Group } from '@semaphore-protocol/group';
import { generateProof, packToSolidityProof } from '@semaphore-protocol/proof';
import './App.css';

function App(): JSX.Element {
  // Identity
  const [identity, setIdentity] = useState<Identity>();
  const [trapdoor, setTrapdoor] = useState<bigint>(BigInt(0));
  const [nullifier, setNullifier] = useState<bigint>(BigInt(0));
  const [commitment, setCommitment] = useState<bigint>(BigInt(0));

  // Group
  const [group, setGroup] = useState<Group>();
  const [userCommitment, setUserCommitment] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  // Proof
  const externalNullifier = BigInt(1);
  const [signal, setSignal] = useState<string>('');

  // Connection to the contract
  const contractAddress = '0x3aa5ebb10dc797cac828524e59a333d0a371443c'; // Goerli
  let contract: ethers.Contract;

  const loadData = () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    contract = new ethers.Contract(contractAddress, contractABI, provider);
    console.log(contract);
  }

  const joinGroupOnChain = async () => {
    if (!userCommitment || !username) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    console.log('signer', signer);

    const myContract = new ethers.Contract(contractAddress, contractABI, signer);
    console.log('contract', myContract);

    const dfd = utils.hexZeroPad(Web3.utils.asciiToHex(username), 32);
    console.log(dfd);
    const result = await myContract.joinGroup(userCommitment, dfd);
    console.log(result);
  }

  const createIdentity = () => {
    const identity = new Identity();
    console.log(identity.trapdoor);
    setTrapdoor(identity.trapdoor);
    setNullifier(identity.nullifier);
    setCommitment(identity.commitment);
    setIdentity(identity);
  }

  const createGroup = () => {
    const group = new Group();
    console.log('group', group);
    setGroup(group);
  }

  const addMember = () => {
    if (!group || !userCommitment) return;
    group.addMember(BigInt(userCommitment));
    console.log('group', group);
  }

  const removeMember = () => {
    if (!group || !userCommitment) return;
    const index = group.indexOf(BigInt(userCommitment));
    group.removeMember(index);
    console.log('group', group);
  }

  const proofMembership = () => {
    if (!group || !userCommitment) return;
    const index = group.indexOf(BigInt(userCommitment));
    const proof = group.generateProofOfMembership(index);
    console.log('proof', proof);
  }

  const createProof = async () => {
    if (!identity || !group) return;
    const fullProof = await generateProof(identity, group, externalNullifier, signal);
    console.log('fullProof', fullProof);
    const solidityProof = await packToSolidityProof(fullProof.proof);
    console.log('solidityProof', solidityProof);
    const { nullifierHash } = fullProof.publicSignals
    console.log('nullifierHash', nullifierHash);
  }

  return (
    <>
      <div className="App">
        {/* Web3 provider */}
        <div>
          <button onClick={loadData}>load data</button>
          <button onClick={joinGroupOnChain}>join group (on-chain)</button>
          <br />
          <input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <br />
        </div>

        <br />

        {/* Identity */}
        <div>
          <button onClick={createIdentity}>Create identity</button>
          <br />
          { trapdoor?.toString() } { nullifier.toString() } { commitment.toString() }
        </div>

        <br />

        {/* Group */}
        <div>
          <button onClick={createGroup}>Create group</button>
          <button onClick={addMember}>Add member</button>
          <button onClick={removeMember}>Remove member</button>
          <button onClick={proofMembership}>Proof membership</button>
          <br />
          <input placeholder="user commitment" onChange={(e) => setUserCommitment(e.target.value)} />
        </div>

        <br />

        {/* Proof */}
        <div>
          <input placeholder="signal" onChange={(e) => setSignal(e.target.value)} />
          <button onClick={async () => await createProof()}>Proof</button>
        </div>
      </div>

    </>
  );
}

export default App;
