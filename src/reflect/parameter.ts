import {Declaration} from "./declaration";
import {Type} from "./type";
import {Decorator} from "../decorators";
import {Method} from "./method";

export class Parameter extends Declaration {

    public id:string;
    public owner:Method;
    public index:number;
    public type:Type;
    public flags:number;
    public decorators:Decorator[];

    constructor(owner:Method,name:string,index:number,flags:number,type:Type){
        super(name);
        Object.defineProperty(this,'owner',{
            enumerable      : true,
            writable        : false,
            configurable    : false,
            value           : owner
        });
        Object.defineProperty(this,'index',{
            enumerable      : true,
            writable        : false,
            configurable    : false,
            value           : index
        });
        Object.defineProperty(this,'id',{
            enumerable  : true,
            value       : `${this.owner.id}:${this.index}.${this.name}`
        });
        Object.defineProperty(this,'flags',{
            enumerable      : true,
            writable        : false,
            configurable    : false,
            value           : flags
        });
        Object.defineProperty(this,'type',{
            enumerable      : true,
            writable        : false,
            configurable    : false,
            value           : type
        });
    }
    public toString(){
        return `${this.constructor.name}(${this.id})`
    }
    private inspect(){
        return this.toString()
    }
}