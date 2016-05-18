import {Loader} from "./base";

export class NodeLoader extends Loader {
    private static get fs():any {
        return Object.defineProperty(this,'fs',<any>{
            value:system.node.require('fs')
        }).fs;
    }
    private static get vm():any {
        return Object.defineProperty(this,'vm',<any>{
            value:system.node.require('vm')
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
            if(id.indexOf('node/')==0){
                accept(this.evalModule(id,url,
                `system.register("${id}",[], function(system,module) {
                    var exported = system.globals.require("${id.substr(5)}");
                    for(var name in exported){
                        module.export(name,exported[name]);
                    }
                    module.export('default',exported);
                })`))
            }else{
                NodeLoader.fs.readFile(url, 'utf8', (err, data)=> {
                    if (err) {
                        reject(err)
                    } else {
                        accept(this.evalModule(id,url,data.toString()))
                    }
                });
            }
        });
    }
    protected evalModule(id:string,url:string,data:string){
        NodeLoader.vm.runInThisContext(data,{
            filename : url
        });
    }
}

