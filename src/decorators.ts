import {Constructor, Method, Property, Parameter} from "./reflect/class";
export abstract class Annotator {
    abstract decorate(target:Constructor|Method|Property|Parameter);
}
export class Decorator extends Annotator {
    public value:any;
    public type:Function;
    constructor(type:Function,value:any){
        super();
        if(type && value){
            Object.defineProperty(this,'type',{
                enumerable      :true,
                writable        :false,
                configurable    :false,
                value           :type,
            });
            Object.defineProperty(this,'value',{
                enumerable      :true,
                writable        :false,
                configurable    :false,
                value           :value,
            })
        }
    }
    decorate(target:Constructor|Method|Property|Parameter){
        console.info(target)
    }
}
export class Metadata extends Annotator {
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
    decorate(target:Constructor|Method|Property|Parameter){
        console.info(target)
    }
}

