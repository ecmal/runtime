import {Main} from './main';
import {Meta} from "../decor/decors";

export class Two {
    constructor(param?:String){
        Main.from('Two');
    }
    public calc(param:String):Function {
        return Main.from.bind(this);
    }
}