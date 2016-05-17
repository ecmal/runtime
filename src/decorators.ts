import {Member} from "./reflect/class";

export class Decorator {
    public decorate(target:Member){}
}

export class Metadata extends Decorator {
    constructor(name:String,value:any){
        super();
        Object.defineProperty(this,'name',{
            enumerable      :true,
            writable        :false,
            configurable    :false,
            value           :name,
        });
        Object.defineProperty(this,'value',{
            enumerable      :true,
            writable        :false,
            configurable    :false,
            value           :value,
        })
    }
    decorate(target:Member){
        console.info(`METADATA DECORATOR ${target.toString()}`);
    }
}

