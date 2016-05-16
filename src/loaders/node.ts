import {Loader} from "./base";

declare var __filename;
declare var __dirname;


export class NodeLoader extends Loader {
    private static get fs():any{
        return Object.defineProperty(this,'fs',<any>{
            value:system.globals.require('fs')
        }).fs;
    }
    private static get vm():any{
        return Object.defineProperty(this,'vm',<any>{
            value:system.globals.require('vm')
        }).vm;
    }
    protected get runtime():string {
        return __filename;
    }
    protected detectRoot(){
        Object.defineProperty(system,'url',{
            enumerable      : true,
            configurable    : false,
            writable        : false,
            value           : this.runtime
        });
    }
    protected loadModule(id:string,url:string):Promise<any>{
        return new Promise<any>((accept,reject)=>{
            NodeLoader.fs.readFile(url, 'utf8', (err, data)=> {
                if (err) {
                    reject(err)
                } else {
                    accept(this.evalModule(id,url,data.toString()))
                }
            });
        });
    }
    protected evalModule(id:string,url:string,data:string){
        NodeLoader.vm.runInThisContext(data,{
            filename : url
        });
    }
}

