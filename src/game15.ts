import {
    DeployArgs,
    Field,
    Permissions,
    SmartContract,
    State,
    state,
    method,
    Poseidon,
    Bool,
    CircuitValue,
    prop,
    matrixProp,
    Circuit,
    arrayProp,
  } from 'snarkyjs';
  
  type LocationJS = { x: number; y: number };
  
  export class Location extends CircuitValue {
    @prop x: Field;
    @prop y: Field;
  
    constructor({ x, y }: LocationJS) {
      super();
      this.x = Field(x);
      this.y = Field(y);
    }
  }
  
  export class Move extends CircuitValue {
    @prop prev: Location;
    @prop now: Location;
  
    constructor(prev: LocationJS, now: LocationJS) {
      super();
  
      this.prev = new Location(prev);
      this.now = new Location(now);
  
    }
  }
  
  export class Board extends CircuitValue {
    @matrixProp(Field, 4, 4) tiles: Field[][];
  
    constructor(tiles: number[][]) {
      super();
  
      this.tiles = tiles.map((row) => row.map(Field));
    }
  }
  
  export class Moves extends CircuitValue {
    @arrayProp(Move, 16) moveList: Move[];
  
    constructor(moveList: { prev: LocationJS; now: LocationJS }[]) {
      super();
      this.moveList = moveList.map(({ prev, now }) => new Move(prev, now));
    }
  }
  
  function validateMoves(moves: Moves) {
    moves.moveList.forEach((move) => {
      // Check if now is [0,4)
      move.now.x.assertGte(0);
      move.now.x.assertLt(4);
      move.now.y.assertGte(0);
      move.now.y.assertLt(4);
  
      // Check if prev is [0,4)
      move.prev.x.assertGte(0);
      move.prev.x.assertLt(4);
      move.prev.y.assertGte(0);
      move.prev.y.assertLt(4);
  
      // Check if there is a one length move to one side
      const rowDiff = move.now.x.sub(move.prev.x);
      const colDiff = move.now.y.sub(move.prev.y);
  
      // One of the differences must be 0
      rowDiff.mul(colDiff).assertEquals(0);
  
      const rcSum = rowDiff.add(colDiff);
      rcSum.mul(rcSum).assertEquals(1);
    })
  }
  
  function hashBoard(board: Board): Field {
    return Poseidon.hash(board.tiles.map(Poseidon.hash));
  }
  
  function applyMoves(board: Board, moves: Moves, idx: number): Board {
    const { moveList } = moves;
    if (idx == moveList.length) {
      return board;
    }
  
    const nextMove = moveList[idx];
    const prev: LocationJS = {
      x: Number(nextMove.prev.x.toString()),
      y: Number(nextMove.prev.y.toString()),
    };
    const now: LocationJS = {
      x: Number(nextMove.now.x.toString()),
      y: Number(nextMove.now.y.toString()),
    };
  
    board.tiles[now.x][now.y].assertEquals(0);
    board.tiles[now.x][now.y] = board.tiles[prev.x][prev.y];
    board.tiles[prev.x][prev.y] = Field(0);
  
    return applyMoves(board, moves, idx + 1);
  }
  
  export class FifteenGame extends SmartContract {
    @state(Bool) isSolved = State<Bool>();
    @state(Field) challenge = State<Field>();
  
    // Setup deploy settings and permissions
    deploy(args: DeployArgs) {
      super.deploy(args);
      this.setPermissions({
        ...Permissions.default(),
        // Proof: If interacted with the smart contract
        // Signature: If deployer
        editState: Permissions.proofOrSignature(),
      });
    }
  
    @method init(board: Board) {
      this.challenge.set(hashBoard(board));
    }
  
    @method solve(start: Board, moves: Moves) {
      // Check if challenge is up to date
      const challenge = this.challenge.get();
      this.challenge.assertEquals(challenge);
  
      // Check if moves are legal
      validateMoves(moves);
  
      // Get hash for the final board
      const targetBoard = new Board([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 0],
      ]);
      const targetHash: Field = hashBoard(targetBoard);
  
      // Check if start board is correct
      hashBoard(start).assertEquals(challenge);
      
      // Apply moves and get hash
      const finalBoard = applyMoves(start, moves, 0);
      const finalHash = hashBoard(finalBoard);
  
      // Check if final hash matches solved board's hash
      finalHash.assertEquals(targetHash);
      this.isSolved.set(Bool(true));
    }
  }