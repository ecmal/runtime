import {Main} from './main';
import {Three} from './three';

export class Two {
    constructor(param?:String){
        Main.from('Two');
        console.info('Two',new Three());
    }
    public calc(param:String):Function {
        return Main.from.bind(this);
    }
}