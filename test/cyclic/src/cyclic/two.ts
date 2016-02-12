import {Main} from './main';
import {Meta} from "../decor/decors";

@Meta('class')
export class Two {
    constructor(@Meta('param') param?:String){
        Main.from('Two');
    }

    @Meta('method','object')
    public calc(@Meta('param') param:String):Function {
        return Main.from.bind(this);
    }
}