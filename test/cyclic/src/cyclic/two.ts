import {Main} from './main';
import three from './three';

export class Two {
    constructor(param?:String){
        Main.from('Two');
        console.info('Two',three);
    }
    public calc(param:String):Function {
        return Main.from.bind(this);
    }
}