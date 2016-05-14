import {Emitter} from "./events";
import {Module} from "./module";
import {NodeLoader} from "./loader";
import {BrowserLoader} from "./loader";
import {Loader} from "./loader";

declare var global:any;
declare var window:any;

declare global {
    interface System {
        url     : string;
        root    : string;
        module  : Module;
        modules : {[k:string]:Module};
    }
}

export class System extends Emitter implements System {

    public url : string;
    public root : string;
    public platform : string;
    public module  : Module;
    public modules : {[k:string]:Module};

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
    public constructor(){
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
            var m = this.modules[n];
            for(var i in m.members){
                m.init(m.members[i],void 0);
            }
            Object.defineProperty(m,'url',{
                enumerable      : true,
                configurable    : false,
                writable        : false,
                value           : this.url
            });
            Object.defineProperty(m,'parent',{
                enumerable      : true,
                configurable    : false,
                writable        : false,
                value           : m==module?null:module
            });
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