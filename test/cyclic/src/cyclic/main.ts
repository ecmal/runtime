import {One} from "./one";
import {Two} from "./two";

export class Base {
    public name:string;
    public one:One;
    public two:Two;
    public toString(){
        return `Base:${this.name}(${this.one},${this.two})`
    }
    constructor(name){
        this.name = name;
    }
}
export class Main extends Base {
    static great:String = 'Main.from';
    static from(target:any):string{
        return `Main(${this.great}) + ${target.toString()}`
    }
    public one:One = new One();
    public two:Two = new Two();

    constructor(config){
        super(config)
    }
}

export default new Main('Test');