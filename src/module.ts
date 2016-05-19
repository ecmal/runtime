import {Class} from "./reflect/class";
import {Type} from "./reflect/class";
import {Path} from "./helpers";

const REFLECT = Symbol('reflection');

declare global {
    interface Module {
        name:string;
        url: string;
        requires: string[];
        members: any;
        exports: any;
        parent: Module;
    }
}

export interface ModuleMap {
    [name:string]:Module;
}

export class Module implements Module {
    /**
     * @internal
     */
    static add(name,requires,definer):Module{
        return Object.defineProperty(system.modules,name,{
            writable     : false,
            enumerable   : true,
            configurable : false,
            value        : new Module(name,requires,definer)
        })[name];
    }
    /**
     * @internal
     */
    static get(name):Module{
        return <Module>system.modules[name];
    }
    /**
     * @internal
     */
    static extend(a,b){
        return Class.extend(a,b);
    }

    public name:string;
    public url:string;
    public requires:string[];
    public members:any;
    public exports:any;
    public parent:Module;

    /**
     * @internal
     */
    public definer:any;
    /**
     * @internal
     */
    public constructor(name,requires,definer){
        this.name = name;
        this.requires = requires;
        this.members = Object.create(null);
        this.exports = Object.create(null);
        this.exports[REFLECT] = this;
        this.definer = definer(system,this);
    }
    /**
     * @internal
     */
    public define(type,value){
        value.__reflection = type;
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
            case 'interface' :
                this.members[value] = Type.get(this.name,value);
                this.exports[value] = this.members[value];
                break;
        }
    }
    /**
     * @internal
     */
    public export(key,value){
        if(typeof key == 'object'){
            for(var k in key){
                this.exports[k] = key[k];
            }
        }else{
            this.exports[key] = value;
        }
    }
    /**
     * @internal
     */
    public init(target,parent){
        const addClass=(target,parent)=>{
            var Child:Class,Parent;
            Object.defineProperty(this.members,target.name,{
                value : Object.defineProperty(target,'class',{
                    value : Child = target[REFLECT] = new Class(this,target.name,target)
                }).class
            });
            Class.extend(target,parent);
            if(target.__initializer){
                target.__initializer(parent);
                delete target.__initializer;
            }
            if(target.__decorator){
                var __decorator = target.__decorator;
                delete target.__decorator;
                __decorator((t,n,f,dt,rt,d,p,i)=>{
                    return Child.decorate(t,n,f,dt,rt,d,p,i);
                },Type.get);
            }
            return Child.value;
        };
        if(target.__reflection){

            var type = target.__reflection;
            delete target.__reflection;
            if(type=='class'){
                //console.info("init class ",target.name);
                return addClass(target,parent);
            }
        }
        return target;
    }
    /**
     * @internal
     */
    public resolve(){
        if(this.definer) {
            if (this.definer.setters && this.definer.setters.length) {
                this.definer.setters.forEach((setter, i)=> {
                    var resolved = Module.get(this.requires[i]);
                    if(resolved) {
                        setter(resolved.exports);
                    }else{
                        console.info(this.requires[i],Module.get(this.requires[i]))
                    }
                });
            }
            delete this.definer.setters;
        }
        return this;
    }
    /**
     * @internal
     */
    public execute(){
        if(this.definer){
            this.resolve();
            var definer = this.definer;
            delete this.definer;
            if(this.requires && this.requires.length){
                this.requires.forEach(r=>{
                    var m:Module = Module.get(r);
                    if(m && m.execute){
                        m.execute();
                    }
                });
            }

            definer.execute();
        }
    }
}


