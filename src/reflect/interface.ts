import {Declaration} from "./declaration";
import {Class} from "runtime/reflect/class";
import {Module} from "runtime/module";

export class Interface extends Declaration {
    public id:string;
    public module:Module;
    public implementations:Class[];
    constructor(module:Module,name:string){
        super(name);
        Object.defineProperty(this,'module',{
            enumerable  : true,
            value       : module
        });
        Object.defineProperty(this,'id',{
            enumerable  : true,
            value       : `${this.module.name}#${this.name}`
        });
        Object.defineProperty(this,'implementations',{
            enumerable  : true,
            value       : []
        });
        Object.defineProperty(system.classes,this.id,{
            enumerable  : true,
            value       : this
        });
    }
}