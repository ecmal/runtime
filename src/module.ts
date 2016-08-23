import {Class} from "./reflect/class";
import {Interface} from "./reflect/interface";
import {Declaration} from "./reflect/declaration";

const REFLECT = Symbol('reflection');

declare global {
    interface Module extends Declaration {
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

export class Module extends Declaration implements Module {
    /**
     * @internal
     */
    static add(name,requires,definer):Module{
        var m = new Module(name,requires,definer);
        Object.defineProperty(system.modules,name,{
            writable     : false,
            enumerable   : true,
            configurable : false,
            value        : m
        });
        system.emit('module',m);
        return m;
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
        super(name);
        this.requires = requires;
        this.members = Object.create(null);
        this.exports = Object.create(null);
        this.exports[REFLECT] = this;
        this.definer = definer(system,this,system['jsx']);
    }
    /**
     * @internal
     */
    public define(type,value){
        value.__reflection = {type:type,module:this};
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
                this.members[value] = new Interface(this,value);
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
        if(target && target.__reflection){
            if(target.__reflection.type=='class'){
                target.__reflection.parent = parent;
                var cls = target.class;
                Object.defineProperty(this.members,cls.name,{
                    enumerable  : true,
                    value       : cls
                });
                return cls.value;
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
                this.emit('resolve');
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

            try{
                definer.execute();
                this.emit('execute');
            }catch(ex){
                var error = new Error(`module "${this.name}" execution error`);
                error.stack +=`\ncause : \n${ex.stack}`;
                throw error;
            }
        }
    }
    public toString(){
        return `Module(${this.name})`
    }
    private inspect(){
        return this.toString();
    }
}


