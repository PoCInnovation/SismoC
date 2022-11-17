import logo from './logo.svg';
import jsonSema from './semaphore.json';
import './App.css';
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof, verifyProof, packToSolidityProof } from "@semaphore-protocol/proof"

const identity = new Identity()
const group = new Group()
group.addMember(identity.commitment)
console.log(group.members)

console.log(identity.toString())

const externalNullifier = group.root
const signal = "test"

const verificationKey = jsonSema

generateProof(identity, group, externalNullifier, signal).then((proof) => {
  console.log(proof)
  verifyProof(verificationKey, proof).then((result) => {
    console.log(result)
  })
}).catch((err) => {
  console.log(err)
})


function App() {
  return (
    <div className="App">
      <header className="App-header">
        
      </header>
    </div>
  );
}

export default App;
