import {Main} from './main';
import {Three} from './three';

export class One {
    constructor(){
        Main.from('One');
        console.info('One',new Three());
    }
    private value:number = 56;
    public get length():number{
        return this.value+1;
    }
    public set length(v:number){
        this.value = v-1;
    }
}
