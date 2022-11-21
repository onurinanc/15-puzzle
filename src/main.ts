import { FifteenGame, Moves, Board } from './game15.js';
import { AccountUpdate, isReady, Mina, PrivateKey, shutdown } from 'snarkyjs';

async function main() {
  await isReady;

  console.log('SnarkyJS Loaded');

  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);

  const deployerAccount = Local.testAccounts[0].privateKey;

  // Create a public/private key pair. The public key is our address and where we will deploy to
  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();

  const startBoard = new Board([
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 0, 15],
  ]);

  const moves = new Moves([{ prev: { x: 3, y: 3 }, now: { x: 3, y: 2 } }]);

  const falseStartBoard = new Board([
    [1, 2, 4, 3],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 0],
  ]);

  const falseMoves1 = new Moves([
    { prev: { x: 3, y: 3 }, now: { x: 3, y: 3 } },
  ]);
  const falseMoves2 = new Moves([
    { prev: { x: 2, y: 2 }, now: { x: 2, y: 3 } },
  ]);

  // Create an instance of our Square smart contract and deploy it to zkAppAddress
  const contract = new FifteenGame(zkAppAddress);
  const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    contract.deploy({ zkappKey: zkAppPrivateKey });
    contract.init(startBoard);
    contract.sign(zkAppPrivateKey);
  });
  await deployTxn.send();

  // Get the initial state of our zkApp account after deployment
  const challenge = contract.challenge.get();
  console.log('Challenge after init:', challenge.toString());

  // False board
  try {
    const solveTx = await Mina.transaction(deployerAccount, () => {
      contract.solve(falseStartBoard, moves);
      contract.sign(zkAppPrivateKey);
    });
    await solveTx.send();
  } catch (e: any) {
    console.log(e.message);
  }

  // False solution 1
  try {
    const solveTx = await Mina.transaction(deployerAccount, () => {
      contract.solve(startBoard, falseMoves1);
      contract.sign(zkAppPrivateKey);
    });
    await solveTx.send();
  } catch (e: any) {
    console.log(e.message);
  }

  // False solution 2
  try {
    const solveTx = await Mina.transaction(deployerAccount, () => {
      contract.solve(startBoard, falseMoves2);
      contract.sign(zkAppPrivateKey);
    });
    await solveTx.send();
  } catch (e: any) {
    console.log(e.message);
  }

  console.log("isSolved", contract.isSolved.get().toBoolean());

  console.log("Calling with right solution");

  // True solution
  const solveTx = await Mina.transaction(deployerAccount, () => {
    contract.solve(
      new Board([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 0, 15],
      ]),
      moves
    );
    contract.sign(zkAppPrivateKey);
  });
  await solveTx.send();

  console.log("isSolved", contract.isSolved.get().toBoolean());

  console.log('Shutting down');
}

main();