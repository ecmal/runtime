import {Main} from './main';

export class Two {
    constructor(param?:String){
        Main.from('Two');
    }
    public calc(param:String):Function {
        return Main.from.bind(this);
    }
}