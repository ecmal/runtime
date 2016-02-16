import {Main} from './main';

export class One {
    constructor(){
        Main.from('One');
    }
    private value:number = 56;
    public get length():number{
        return this.value+1;
    }
    public set length(v:number){
        this.value = v-1;
    }
}
