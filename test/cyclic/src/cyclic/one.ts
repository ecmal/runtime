import {Main} from './main';
import {Meta} from "../decor/decors";

@Meta('class')
export class One {

    constructor(){
        Main.from('One');
    }

    @Meta('field','object')
    private value:number = 56;

    @Meta('accessor','object','both')
    public get length():number{
        return this.value+1;
    }
    public set length(v:number){
        this.value = v-1;
    }
}
