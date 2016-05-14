import {Class, Modifier} from "./reflect/class";
import {Decorator} from "./decorators";
import {Metadata} from "./decorators";
import {Parameter} from "./decorators";
import {Type} from "./decorators";

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
    static add(name,requires,definer):Module{
        return Object.defineProperty(system.modules,name,{
            writable     : false,
            enumerable   : true,
            configurable : false,
            value        : new Module(name,requires,definer)
        })[name];
    }
    static get(name){
        return system.modules[name];
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
                this.addClass(target,parent);
            }
        }
    }
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
            console['group']("Module:execute", this.name);
            definer.execute();
            console['groupEnd']();
        }
    }

    private addClass(target,parent){

        var Child,Parent;
        Object.defineProperty(this.members,target.name,{
            value : Object.defineProperty(target,'class',{
                value : Child = new Class(this,target.name,target)
            }).class
        });
        Module.extend(target,parent);
        if(target.__initializer){
            target.__initializer(parent);
            delete target.__initializer;
        }
        if(target.__decorator){
            console.info("Class:",Child.id);
            var __decorator = target.__decorator;
            delete target.__decorator;
            __decorator((t,f,m,d)=>{
                var isStatic,isClass = typeof m!='string';

                var Target=t,decorators=d,member,flags=f;

                if(isClass){
                    decorators = f;
                }else{
                    isStatic = Modifier.has(flags,Modifier.PUBLIC);
                    member = Target.class.getMember(m,flags);
                    if(!member){
                        member = Target.class.getMember(m,flags,{
                            configurable : true,
                            writable     : true,
                            enumerable   : Modifier.has(flags,Modifier.PUBLIC),
                            value        : null
                        })
                    }
                }
                decorators = decorators.map((d:any)=>{
                    var DecorType:any = d.shift();
                    var params = d,decor;
                    if(typeof DecorType=="function"){
                        if(!!DecorType.class){
                            decor = new DecorType(...params);
                        }else{
                            decor = DecorType(...params);
                            if(decor){
                                decor.constructor = DecorType;
                            }
                        }
                    } else {
                        decor = DecorType;
                    }
                    if(typeof decor == 'function'){
                        decor = new Decorator(decor)
                    }
                    if(!decor){
                        throw new Error(`Decorator "${DecorType.name}" must return a value`)
                    }
                    if(!(decor instanceof Decorator)){
                        decor = new Metadata(decor.constructor.name,decor)
                    }
                    return decor;
                });
                if(isClass){
                    console.info(`  Decorating ${Target.class.id}`,decorators);
                    return Target.class.decorate(decorators);
                }else{
                    if(member){
                        console.info(`  Decorating ${member.id}`,decorators);
                        member.decorate(decorators);

                    }else{
                        throw new Error(`Can't decorate ${Target.class.id}${isStatic?'.':'.'}${m}(${flags}) is undefined`)
                    }
                }
            },Metadata,Type,Parameter);
        }

    }


}


