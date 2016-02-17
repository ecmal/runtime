import {Main} from './main';
import three from './three';

export class One {
    constructor(){
        Main.from('One');
        console.info('One',three);
    }
    private value:number = 56;
    public get length():number{
        return this.value+1;
    }
    public set length(v:number){
        this.value = v-1;
    }
}
