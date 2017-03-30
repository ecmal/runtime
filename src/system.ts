import {Emitter} from "./events";
import {Module} from "./module";
import {AppLoader} from "./loader";
import {WebLoader} from "./loader";
import {Loader} from "./loader";
declare var global:any;
declare var window:any;


export class System extends Emitter {
    public url      : string;
    public root     : string;
    public module   : Module;
    public modules  : {[name:string]:Module};
    public globals  : any;
    public platform : "app"|"web";

    public import(name:string){
        return this.loader.import(name);
    }
    public register(name:string,requires:string[],definer:Function){
        return this.loader.register(name,requires,definer);
    }

    
    /**
     * @internal
     */
    private promises : any[];
    /**
     * @internal
     */
    private events : any;

    /**
     * @internal
     */
    private loader : Loader;

    /**
     * @internal
     */
    public constructor(platform,globals,imports){
        super();
        let modules = this.modules;
        delete this.import;
        delete this.register;
        delete this.modules;
        Object.defineProperty(this,'platform',{
            value : platform
        })
        Object.defineProperty(this,'globals',{
            value : globals
        })
        Object.defineProperty(this,'modules',{
            value : modules
        })
        switch(this.platform){
            case 'app': Object.defineProperty(this,'loader',{
                value : new AppLoader()
            });break;
            case 'web': Object.defineProperty(this,'loader',{
                value : new WebLoader()
            });break;
        }
        Object.defineProperty(this,'module',{
            enumerable   : true,
            writable     : false,
            configurable : false,
            value        : this.modules[__moduleName]
        });
        for(var n in this.modules){
            var m:Module = this.modules[n];
            if(!m.url){
                Object.defineProperty(m,'url',{
                    enumerable      : true,
                    configurable    : false,
                    writable        : false,
                    value           : this.url
                });
            }
        }
        let start = Date.now();
        let chain = Promise.resolve();
        Object.keys(imports).forEach((id)=>{
            let promise = imports[id];
            if(this.modules[id]){
                promise.accept(this.modules[id].exports);
            }else{
                chain = chain.then(r=>this.loader.import(id).then(
                    m=>promise.accept(m),
                    e=>promise.reject(e)
                ));
            }
        });
        /*chain.then(r=>{
            console.info(`System started in ${Date.now()-start}ms`);
        })*/
    }
}

export default System;