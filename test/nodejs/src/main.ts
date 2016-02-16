import {One} from "./one";
import {Two} from "./two";
import * as FS from "node/fs";
import * as CP from "node/child_process";

export class Base extends Object {
    constructor(config){
        super();
        console.info("Base",this.constructor.name,config);
    }
}
export class Main extends Base {
    static great:String = 'Main.from';
    static get greatGetter():String{
        return this.great
    };
    static set greatSetter(v:String){
        this.great = v;
    };
    static from(target:any):void{
        console.info(this.great,target);
    }
    public other:()=>any;
    public one:One = new One();
    public two:Two = new Two();

    constructor(config){
        super(config)
        console.info(__dirname);
        console.info(__filename);
        console.info(require('http-server'));
        console.info(CP);
    }
}
