import {One} from "./one";
import {Two} from "./two";

import {Meta} from "../decor/decors";

@Meta('class')
export class Main {

    @Meta('field','static')
    static great:String = 'Main.from';

    @Meta('accessor','static')
    static get greatGetter():String{
        return this.great
    };
    @Meta('accessor','static')
    static set greatSetter(v:String){
        this.great = v;
    };
    @Meta('method')
    static from(target:any){
        console.info(this.great,target);
    }

    public one:One = new One();
    public two:Two = new Two();

    constructor(config){
        console.info("Main.new",config);
    }
}

export default new Main('Test');