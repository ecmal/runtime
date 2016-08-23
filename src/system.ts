import {Emitter} from "./events";
import {Module,ModuleMap} from "./module";
import {NodeLoader} from "./loader";
import {BrowserLoader} from "./loader";


import {Loader} from "./loader";
import {Class,ClassMap} from "./reflect/class";

import "./globals";


declare var global:any;
declare var window:any;


export interface Globals {
    [k:string]:any;
}
export interface NodeGlobals {
    process   : any;
    module    : any;
    dirname   : string;
    filename  : string;
    require(module:string):any;
}
export interface BrowserGlobals {
    [k:string]:any;
}

declare global {
    interface System extends Emitter {
        url         : string;
        root        : string;
        platform    : "browser"|"node";
        module      : Module;
        modules     : {[k:string]:Module};
        classes     : {[k:string]:Class};
        globals     : any;
        node        : NodeGlobals;
        browser     : BrowserGlobals;
    }
}
export class System extends Emitter implements System {

    public url      : string;
    public root     : string;
    public module   : Module;
    public modules  : ModuleMap;
    public get classes():ClassMap{
        return Object.defineProperty(this,'classes',{
            value:Object.create(null)
        }).classes
    }
    public import(name:string){
        return this.loader.import(name);
    }
    public register(name:string,requires:string[],definer:Function){
        return this.loader.register(name,requires,definer);
    }

    public get globals():any {
        if(this.platform=='browser'){
            return window;
        }else{
            return global;
        }
    }
    public get platform():string {
        if(typeof global!='undefined') {
            global.system = system;
            return Object.defineProperty(this,'platform',{
                enumerable   : true,
                writable     : false,
                configurable : false,
                value        : 'node'
            }).platform;
        } else
        if(typeof window!='undefined') {
            window.system = system;
            return Object.defineProperty(this,'platform',{
                enumerable   : true,
                writable     : false,
                configurable : false,
                value        : 'browser'
            }).platform;
        }
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
    public constructor(process?){
        super();
        Object.defineProperty(this,'jsx',{
            enumerable   : false,
            writable     : false,
            configurable : false,
            value        : {}
        });
        Object.defineProperty(this,'module',{
            enumerable   : true,
            writable     : false,
            configurable : false,
            value        : module
        });
        Object.defineProperty(this,'modules',{
            enumerable   : true,
            writable     : false,
            configurable : false,
            value        : this.modules
        });
        if(typeof global!='undefined') {
            global.system = system;
            Object.defineProperty(this,'platform',{
                enumerable   : true,
                writable     : false,
                configurable : false,
                value        : 'node'
            });
            Object.defineProperty(this,'loader',{
                enumerable   : true,
                writable     : false,
                configurable : false,
                value        : new NodeLoader()
            });
        } else
        if(typeof window!='undefined') {
            window.system = system;
            Object.defineProperty(this,'platform',{
                enumerable   : true,
                writable     : false,
                configurable : false,
                value        : 'browser'
            });
            Object.defineProperty(this,'loader',{
                enumerable   : true,
                writable     : false,
                configurable : false,
                value        : new BrowserLoader()
            });
        }

        for(var n in this.modules){
            var m:Module = this.modules[n];
            if(m.name.indexOf('runtime/')==0){
                for(var i in m.members){
                    var member = m.members[i];
                    if(member.type == 'interface'){
                        m.define(member.type,member.value);
                    }else
                    if(member.__reflection.type=='class'){
                        Object.defineProperty(m.members,i,{
                            enumerable  : true,
                            value       : member.class
                        });
                    }
                }
            }
            if(!m.url){
                Object.defineProperty(m,'url',{
                    enumerable      : true,
                    configurable    : false,
                    writable        : false,
                    value           : this.url
                });
            }
            if(!m.parent){
                Object.defineProperty(m,'parent',{
                    enumerable      : true,
                    configurable    : false,
                    writable        : false,
                    value           : m==module?null:module
                });    
            }
        }
        if(this.events){
            for(var i in this.events){
                this.on(i,this.events[i]);
            }
            delete this.events;
        }
        console.info(`system started in ${(Date.now()-this['started'])/1000} seconds`,this.promises && this.promises.length)
        this.emit('init');
        if(this.promises && this.promises.length){
            var resolved = [];
            var promise;
            while (promise = this.promises.shift()){
                resolved.push(new Promise((accept,reject)=>{
                    promise.accept((success)=>{
                        if(success){
                            accept()
                        }else{
                            reject();
                        }
                    });
                }));

            }
            delete this.promises;
            Promise.all(resolved).then(()=>this.emit('load'));
        }else{
            this.emit('load');
        }
    }
    
}
export default system;