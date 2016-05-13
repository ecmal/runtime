import {Loader} from "./base";
declare var __filename;
declare var __dirname;

export class NodeLoader extends Loader {
    protected get runtime():string {
        return __filename;
    }
    protected detectRoot(){
        Object.defineProperty(system,'url',{
            enumerable:true,
            configurable:false,
            writable:false,
            value:this.runtime
        });
    }
    protected loadModule(id:string,url:string):Promise<any>{
        return null;
    }
}

