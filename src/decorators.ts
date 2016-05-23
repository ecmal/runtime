import {Declaration} from "./reflect/declaration";

export class Decorator {
    public decorate(target:Declaration){}
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
    decorate(target:Declaration){
        console.info(`METADATA DECORATOR ${target.toString()}`);
    }
}

