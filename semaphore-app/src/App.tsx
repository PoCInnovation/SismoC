import { useState } from 'react';
import { Identity } from '@semaphore-protocol/identity'
import { Group } from '@semaphore-protocol/group';
import { generateProof } from '@semaphore-protocol/proof';
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

  // Proof
  const externalNullifier = BigInt(1);
  const [signal, setSignal] = useState<string>('');

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
  }

  return (
    <>
      <div className="App">
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
