import {Class} from "./reflect/class";

const reflection = Symbol('reflection');

declare global {
    interface Module {
        name:string;
        url: string;
        requires: string[];
        members: any;
        exports: any;
    }
}

export class Module implements Module {
    static modules:any = Object.create(null);
    static set(module):Module{
        this.modules[module.name] = module;
        if(!(module instanceof Module)){
            Object.setPrototypeOf(module,Module.prototype);
        }
        return module;
    }
    static add(name,requires,definer):Module{
        var module = Module.set({name:name});
        Module.call(module,name,requires,definer);
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
    public url:string;
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
        if(target.__reflection){
            var type = target.__reflection;
            delete target.__reflection;
            if(type=='class'){
                console.info('init class',target.name,parent?parent.name:'');
                Module.extend(target,parent);
                if(target.__decorator){
                    //console.info(" decorator",target.__decorator);
                    //target.__decorator(parent);
                    //delete target.__decorator;
                }
                if(target.__initializer){
                    //console.info(" initializer",target.__initializer);
                    target.__initializer(parent);
                    delete target.__initializer;
                }
            }
        }
    }
    public resolve(){
        if(this.definer) {
            if (this.definer.setters && this.definer.setters.length) {
                this.definer.setters.forEach((setter, i)=> {
                    setter(Module.get(this.requires[i]).exports);
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
                    var m = Module.get(r);
                    if(m && m.execute){
                        m.execute();
                    }
                });
            }
            definer.execute();
        }
    }
    
    /**
     * @internal
     */
    public initialize(reflection:symbol){
        console.info('initialize',this,reflection);
        function initClass(module:Module,name:string,ctor:Function){
            return Object.defineProperty(ctor,'class',{
                value:ctor[reflection] = new Class(module,name,ctor)
            }).class;
        }
        for(var i in this.members){
            var member = this.members[i];
            switch(member[reflection]){
                case 'class' : this.members[i] = initClass(this,i,member);
            }
        }
    }
}


