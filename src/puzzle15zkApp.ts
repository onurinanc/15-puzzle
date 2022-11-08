import {
    Field,
    SmartContract,
    state,
    State,
    matrixProp,
    CircuitValue,
    method,
    Bool,
    DeployArgs,
    Permissions,
    Circuit,
    prop,
    Poseidon,
    arrayProp,
} from "snarkyjs";

const DEFAULT_MAX_LENGTH = 300;

export class Location extends CircuitValue {
    @prop row: Field;
    @prop col: Field;

    static fromField(row: Field, col: Field) {
        return new Location(row, col);
    }
}

export class Locations extends CircuitValue {
    @prop length = DEFAULT_MAX_LENGTH;
    @arrayProp(Location, DEFAULT_MAX_LENGTH) values: Location[];

    private constructor(values: Location[]) {
        super(values);
    }
    
}



export class DictAccess extends CircuitValue {
    @prop key: Field;
    @prop prev_value: Field;
    @prop new_value: Field;

    static fromField(key: Field, prev_value: Field, new_value: Field){
        return new DictAccess(key, prev_value, new_value);
    }
}

/*class InitialState extends CircuitValue {
    @matrixProp(Field, 4, 4) value: Field[][];
  
    constructor(value: number[][]) {
      super();
      this.value = value.map((row) => row.map(Field));
    }
  
    hash() {
      return Poseidon.hash(this.value.flat());
    }
  }*/

export class puzzle15zkApp extends SmartContract{
    @state(Field) puzzle15Hash = State<Field>();
    @state(Bool) isSolved = State<Bool>();

    /*@method init(puzzle15Instance : Puzzle15){
        this.puzzle15Hash.set(puzzle15Instance.hash());
        this.isSolved.set(Bool(false));
    }*/

    @method init(x : Field){
        this.puzzle15Hash.set(Poseidon.hash([x]));
        this.isSolved.set(Bool(false));
    }

    deploy(args: DeployArgs) {
        super.deploy(args);
        this.setPermissions({
          ...Permissions.default(),
          editState: Permissions.proofOrSignature(),
        });
      }

    /*@method verify_valid_location(loc: Location){
        let row = loc.row;
            (row.mul(row.sub(1)).mul(row.sub(2)).mul(row.sub(3))).assertEquals(0);

            let col = loc.col;
            (col.mul(col.sub(1)).mul(col.sub(2)).mul(col.sub(3))).assertEquals(0);
    }

    @method verify_adjacent_locations(loc0: Location, loc1: Location){
        let row_diff = loc0.row.sub(loc1.row);
        let col_diff = loc0.col.sub(loc1.col);

        let col_check = col_diff.mul(col_diff); 
        let row_check = row_diff.mul(row_diff);
        
        //Circuit.if()
        //eğer doğruysa a yoksa b'yi çalıştır.


    }/*

    /*@method verify_location_list(loc_list : Location[]){
        for(let i = 0; i < loc_list.length; i++) {
            this.verify_valid_location(loc_list[i]);
        }

        for(let j = 0; j < (loc_list.length - 1); j++){
            this.verify_adjacent_locations(loc_list[j], loc_list[j+1]);
        }
    }*/

    @method verify_location_list(loc_list : Locations){

        for(let i = 0; i < loc_list.length ; i++) {
            verify_valid_location(loc_list[i]);
        }

        for(let j = 0; j < (loc_list.length - 1); j++){
            verify_adjacent_locations(loc_list[j], loc_list[j+1]);
        }

        function verify_valid_location(loc: Location){
            let row = loc.row;
            (row.mul(row.sub(1)).mul(row.sub(2)).mul(row.sub(3))).assertEquals(0);
    
            let col = loc.col;
            (col.mul(col.sub(1)).mul(col.sub(2)).mul(col.sub(3))).assertEquals(0);
        }

        function verify_adjacent_locations(loc0: Location, loc1: Location){
            let row_diff = loc0.row.sub(loc1.row);
            let col_diff = loc0.col.sub(loc1.col);
    
            let col_check = col_diff.mul(col_diff); 
            let row_check = row_diff.mul(row_diff);
            
            //Circuit.if()
            //eğer doğruysa a yoksa b'yi çalıştır.
        }
    }

    

    /*@method checkSolution(puzzle15Solution : InitialState, loc_list : Location[], tile_list : Field[]){
        // Check whether initialStateSolution is same as the puzzle15Instance
        let puzzle15Hash = this.puzzle15Hash.get();
        this.puzzle15Hash.assertEquals(puzzle15Hash);
        puzzle15Solution.hash().assertEquals(puzzle15Hash);

        // verify_valid_location -> all locations
        // verify_adjacent_locations -> all locations





        this.isSolved.set(Bool(true));
        
    }*/

    

    /*@method checkSolution(puzzle15Instance: Puzzle15, loc_list : Location, tile_list : Field[]){
        let puzzle15 = puzzle15Instance.value;
        
        function verify_valid_location(loc: Location) {
            let row = loc.row;
            (row.mul(row.sub(1)).mul(row.sub(2)).mul(row.sub(3))).assertEquals(0);

            let col = loc.col;
            (col.mul(col.sub(1)).mul(col.sub(2)).mul(col.sub(3))).assertEquals(0);
        }

        function verify_adjacent_localtion(loc0: Location, loc1: Location ){
            let row_diff = loc0.row.sub(loc1.row);
            let col_diff = loc0.col.sub(loc1.col);

            // if row_diff == 0 do this
            // else do this
            let my_bool = row_diff.equals(0);

            const x = Circuit.if(my_bool, (col_diff.mul(col_diff)).assertEquals(1), (row_diff.mul(row_diff).assertEquals(1)));
            
        }*/
    }