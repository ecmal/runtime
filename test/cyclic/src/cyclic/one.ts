import {Main} from './main';
import three from './three';

export class One {
    public value;
    constructor(){
        this.value = Main.from(three);
    }
    toString(){
        return `One(${this.value})`;
    }
}
