import {Emitter} from "./events";
import {Module,ModuleMap} from "./module";
import {NodeLoader} from "./loader";
import {BrowserLoader} from "./loader";


import {Loader} from "./loader";
import {Class,ClassMap} from "./reflect/class";


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
    interface System {
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
    public platform : string;
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

    /**
     * @internal
     */
    private promises : any[];

    /**
     * @internal
     */
    private loader : Loader;

    /**
     * @internal
     */
    public constructor(process?){
        super();
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
                    m.init(m.members[i],null);
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
        this.emit('init');
        if(this.promises && this.promises.length){
            var promise;
            while (promise = this.promises.shift()){
                promise.accept();
            }
            delete this.promises;
        }
    }
    
}
export default system;