import {Loader} from "./base";

declare var require:(n:string)=>any;

export class AppLoader extends Loader {
    constructor(){
        super();
        var nodeModules = [];
        Object.keys(System.modules).forEach((k) =>{
            System.modules[k].requires.forEach((k) =>{
                if (k.indexOf('node/') == 0 && nodeModules.indexOf(k)<0) {
                    nodeModules.push(k);
                }
            });
        });
        if (nodeModules.length) {
            nodeModules.forEach((k)=>{
                this.evalModule(k, System.url, this.nodeModule(k));
            });
            this.doDefineModules();
        }
    }

    private static get fs():any {
        return Object.defineProperty(this,'fs',<any>{
            value:require('fs')
        }).fs;
    }
    private static get vm():any {
       return Object.defineProperty(this,'vm',<any>{
            value:require('vm')
        }).vm;
    }
    protected get runtime():string {
        return __filename;
    }
    protected detectRoot(){
        Object.defineProperty(System,'url',{
            enumerable      : true,
            configurable    : false,
            writable        : false,
            value           : this.runtime
        });
    }
    protected loadModule(id:string,url:string):Promise<any>{
        return new Promise<any>((accept,reject)=>{
            if(id.indexOf('node/')==0){
                this.evalModule(id,url,this.nodeModule(id))
                accept(this.registrations[id])
            }else{
                AppLoader.fs.readFile(url, 'utf8', (err, data)=> {
                    try{
                        this.evalModule(id,url,data.toString())
                        if (err) {
                            reject(err)
                        } else {
                            accept(this.registrations[id])
                        }
                    }catch(ex){
                        reject(ex);
                    }
                });
            }
        });
    }
    protected loadProject(id:string,url:string):Promise<any>{
        return new Promise<any>((accept,reject)=>{
            AppLoader.fs.readFile(url, 'utf8', (err, data)=> {
                try {
                    if (err) {
                        reject(err)
                    } else {
                        accept(JSON.parse(data.toString()))
                    }
                } catch(ex) {
                    reject(ex)
                }
            });
        });
    }
    protected nodeModule(id){
        return `__module("${id}",[],function(system,module) {
            Object.defineProperty(module,'exports',{
                configurable    : true,
                writable        : false,
                value           : require("${id.substr(5)}")
            })
        })`
    }
    protected evalModule(id:string,url:string,data:string){
        this.current = id;
        AppLoader.vm.runInThisContext(data,{
            filename : url,
        });
        this.current = null;
    }
}

