import {Emitter} from "./events";
import {Module} from "./reflect/module";
import {Loader} from "./loaders/base";

declare var global:any;
declare var window:any;

const reflection:symbol = Symbol('reflection');

declare global {
    interface System extends Emitter {
        module:Module;
        import(name:string):Promise<any>;
    }
}
export class SystemModule {
    static modules:any = Object.create(null);
    static set(module):SystemModule{
        this.modules[module.name] = module;
        if(!(module instanceof SystemModule)){
            Object.setPrototypeOf(module,SystemModule.prototype);
        }
        return module;
    }
    static add(name,requires,definer):SystemModule{
        var module = SystemModule.set({name:name});
        SystemModule.call(module,name,requires,definer);
        return module;
    }
    static get(name){
        return this.modules[name]
    }
    static remove(name){
        delete this.modules[name];
    }
    static extend(d:Function, b:Function) {
        if(b){
            Object.setPrototypeOf(d, b);
            Object.setPrototypeOf(d.prototype, b.prototype);
        }
        Object.defineProperty(d.prototype, 'constructor', {
            configurable    : true,
            value           : d
        });
    }

    public name:string;
    public requires:string[];
    public members:any;
    public exports:any;
    public definer:any;

    constructor(name,requires,definer){
        this.name = name;
        this.requires = requires;
        this.members = Object.create(null);
        this.exports = Object.create(null);
        this.exports[reflection] = this;
        this.definer = definer(system,this);
    }
    public define(type,value){
        value[reflection]=type;
        switch(type){
            case 'class'    :
                this.members[value.name] = value;
                break;
            case 'function' :
                this.members[value.name] = value;
                break;
            case 'enum'     :
                this.members[value.constructor.name] = value;
                break;
        }
    }
    public export(key,value){
        if(typeof key == 'object'){
            for(var k in key){
                this.exports[k] = key[k];
            }
        }else{
            this.exports[key] = value;
        }
    }

    public init(target,parent){
        var type = target[reflection];
        if(type=='class'){
            SystemModule.extend(target,parent);
            if(target.__initializer){
                target.__initializer({
                    apply : Function.prototype.apply.bind(parent),
                    call  : Function.prototype.call.bind(parent)
                });
                delete target.__initializer;
            }
        }
    }
    public resolve(){
        if(this.definer) {
            if (this.definer.setters && this.definer.setters.length) {
                this.definer.setters.forEach((setter, i)=> {
                    setter(SystemModule.get(this.requires[i]).exports);
                });
            }
            delete this.definer.setters;
        }
        return this;
    }
    public execute(){
        if(this.definer){
            var definer = this.definer;
            delete this.definer;
            if(this.requires && this.requires.length){
                this.requires.forEach(r=>{
                    SystemModule.get(r).execute();
                });
            }
            definer.execute();
        }
    }

    public initialize(s:symbol){

    }
}

abstract class System implements System {
    public url : string;
    public root : string;
    public platform : string;
    public module  : Module;
    public modules : {
        [k:string] : Module;
    };

    public abstract once(event: string, handler: Function):(options:any)=>void;
    public abstract on(event: string, handler: Function):(options:any)=>void;
    public abstract off(event?: string, handler?: Function): void;
    public abstract emit(event: string, ...args: any[]): any[];

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
    public constructor(){
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
            value        : Object.create(null)
        });
        if(typeof global!='undefined'){
            Object.defineProperty(this,'platform',{
                enumerable   : true,
                writable     : false,
                configurable : false,
                value        : 'node'
            });
        }else
        if(typeof window!='undefined'){
            Object.defineProperty(this,'platform',{
                enumerable   : true,
                writable     : false,
                configurable : false,
                value        : 'browser'
            });
        }
        this.doInitialize();
    }

    /**
     * @internal
     */
    private promises : any[];
    /**
     * @internal
     */
    private registrations : any;
    /**
     * @internal
     */
    private loader : Loader;

    /**
     * @internal
     */
    private doInitialize(){
        var modules = Object.keys(this.registrations).map(name=>{
            var m = this.registrations[name];
            delete this.registrations[name];
            return SystemModule.add(name,m.requires,m.definer)
        });
        var current = SystemModule.set(module);
        modules.unshift(current);
        current.exports[reflection] = current;
        for(var i in current.members){
            var m = current.members[i];
            m[reflection] = 'class';
            current.init(m,null);
        }
        modules.forEach(m=>m.resolve());
        var Loaders     = SystemModule.get("runtime/loader").exports;
        var Module      = SystemModule.get("runtime/reflect/module").exports.Module;
        var Emitter     = SystemModule.get("runtime/events").exports.Emitter;
        Object.getOwnPropertyNames(Emitter.prototype).forEach(key=>{
            if(key!='constructor'){
                var descriptor = Object.getOwnPropertyDescriptor(Emitter.prototype,key);
                Object.defineProperty(System.prototype,key,descriptor);
                Object.defineProperty(SystemModule.prototype,key,descriptor);
            }
        });
        modules.forEach(m=>m.execute());
        if(this.platform=='node'){
            this.loader = new Loaders.NodeLoader(reflection);
        } else
        if(this.platform=='browser'){
            this.loader = new Loaders.BrowserLoader(reflection);
        }
        modules.forEach((m:SystemModule)=>{
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
                value           : m==current?null:module
            });
            Object.setPrototypeOf(m,Module.prototype);
            Object.defineProperty(this.modules,m.name,{
                enumerable      :true,
                configurable    :false,
                writable        :false,
                value           :m.exports
            });
            SystemModule.remove(m.name);
            m.initialize(reflection);
        });

        delete this.registrations;

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

export {System};
export default system;