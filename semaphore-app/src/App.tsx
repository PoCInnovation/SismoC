import { useState } from 'react';
import { Identity } from '@semaphore-protocol/identity'
import { Group } from '@semaphore-protocol/group';
import { generateProof, verifyProof, packToSolidityProof } from '@semaphore-protocol/proof';
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
  const verificationKey = {
    "protocol": "groth16",
    "curve": "bn128",
    "nPublic": 4,
    "vk_alpha_1": [
        "20491192805390485299153009773594534940189261866228447918068658471970481763042",
        "9383485363053290200918347156157836566562967994039712273449902621266178545958",
        "1"
    ],
    "vk_beta_2": [
        [
            "6375614351688725206403948262868962793625744043794305715222011528459656738731",
            "4252822878758300859123897981450591353533073413197771768651442665752259397132"
        ],
        [
            "10505242626370262277552901082094356697409835680220590971873171140371331206856",
            "21847035105528745403288232691147584728191162732299865338377159692350059136679"
        ],
        [
            "1",
            "0"
        ]
    ],
    "vk_gamma_2": [
        [
            "10857046999023057135944570762232829481370756359578518086990519993285655852781",
            "11559732032986387107991004021392285783925812861821192530917403151452391805634"
        ],
        [
            "8495653923123431417604973247489272438418190587263600148770280649306958101930",
            "4082367875863433681332203403145435568316851327593401208105741076214120093531"
        ],
        [
            "1",
            "0"
        ]
    ],
    "vk_delta_2": [
        [
            "16243966861079634958125511652590761846958471358623040426599000904006426210032",
            "13406811599156507528361773763681356312643537981039994686313383243831956396116"
        ],
        [
            "15688083679237922164673518758181461582601853873216319711156397437601833996222",
            "11781596534582143578120404722739278517564025497573071755253972265891888117374"
        ],
        [
            "1",
            "0"
        ]
    ],
    "vk_alphabeta_12": [
        [
            [
                "2029413683389138792403550203267699914886160938906632433982220835551125967885",
                "21072700047562757817161031222997517981543347628379360635925549008442030252106"
            ],
            [
                "5940354580057074848093997050200682056184807770593307860589430076672439820312",
                "12156638873931618554171829126792193045421052652279363021382169897324752428276"
            ],
            [
                "7898200236362823042373859371574133993780991612861777490112507062703164551277",
                "7074218545237549455313236346927434013100842096812539264420499035217050630853"
            ]
        ],
        [
            [
                "7077479683546002997211712695946002074877511277312570035766170199895071832130",
                "10093483419865920389913245021038182291233451549023025229112148274109565435465"
            ],
            [
                "4595479056700221319381530156280926371456704509942304414423590385166031118820",
                "19831328484489333784475432780421641293929726139240675179672856274388269393268"
            ],
            [
                "11934129596455521040620786944827826205713621633706285934057045369193958244500",
                "8037395052364110730298837004334506829870972346962140206007064471173334027475"
            ]
        ]
    ],
    "IC": [
        [
            "1964404930528116823793003656764176108669615750422202377358993070935069307720",
            "2137714996673694828207437580381836490878070731768805974506391024595988817424",
            "1"
        ],
        [
            "19568893707760843340848992184233194433177372925415116053368211122719346671126",
            "11639469568629189918046964192305250472192697612201524135560178632824282818614",
            "1"
        ],
        [
            "5317268879687484957437879782519918549127939892210247573193613900261494313825",
            "528174394975085006443543773707702838726735933116136102590448357278717993744",
            "1"
        ],
        [
            "14865918005176722116473730206622066845866539143554731094374354951675249722731",
            "3197770568483953664363740385883457803041685902965668289308665954510373380344",
            "1"
        ],
        [
            "6863358721495494421022713667808247652425178970453300712435830652679038918987",
            "15025816433373311798308762709072064417001390853103872064614174594927359131281",
            "1"
        ]
    ]
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
    const result = await verifyProof(verificationKey, fullProof);
    console.log('verifyProof result', result);
    const solidityProof = await packToSolidityProof(fullProof.proof);
    console.log('solidityProof', solidityProof);
    const { nullifierHash } = fullProof.publicSignals
    console.log('nullifierHash', nullifierHash);
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
