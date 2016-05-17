import {Emitter} from "runtime/events";

export class Declaration extends Emitter {

    public name:string;
    public metadata:any;

    constructor(name:string){
        super();
        Object.defineProperty(this,'name',{
            enumerable : true,
            value      : name
        });
        Object.defineProperty(this,'metadata',{
            enumerable : true,
            value      : Object.create(null)
        });
    }

}