import {Main} from './main';
import three from './three';

export class Two {
    public value;
    constructor(){
        this.value = Main.from(three);
    }
    toString(){
        return `Two(${this.value})`;
    }
}