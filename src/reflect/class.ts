import {Declaration} from "./declaration";
import {Decorator} from "../decorators";
import {Member} from "./member";
import {Interface} from "./interface";
import {Type} from "./type";
import {Modifier} from "./modifier";
import {Parameter} from "./parameter";
import {Property} from "./property";
import {Method} from "./method";
import {Constructor} from "./constructor";
import {Module} from "../module";


declare global {
    interface Function {
        class:Class;
    }
}
export interface ClassMap {
    [name:string]:Module;
}
Object.defineProperty(Function.prototype,'class',{
    enumerable      : true,
    configurable    : true,
    get(){
        return Object.defineProperty(this,'class',{
            enumerable      : true,
            configurable    : false,
            writable        : false,
            value           : new Class(this)
        }).class;
    }
});

export class Class extends Interface {
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
    static isClass(target:Function){
        return target.class instanceof Class;
    }

    public id:string;
    public module:Module;
    public original:Function;
    public value:Function;
    public members:{[name:string]:Member};
    public decorators:Decorator[];
    public interfaces:Type[];
    public inheritance:Type;

    public get type():Type {
        return Object.defineProperty(this,'type',{
            value : Type.get(this)
        })
    }
    public get parent():Class {
        var parent = null;
        if(this.value.prototype.__proto__){
            parent = this.value.prototype.__proto__.constructor.class;
        }
        Object.defineProperty(this,'parent',{
            configurable:true,
            value : parent
        });
        return parent;
    }

    public get flags():number{
        return this.getConstructor().flags;
    }
    public get isExported(){
        return Modifier.has(this.flags,Modifier.EXPORT);
    }
    public get isDefault(){
        return Modifier.has(this.flags,Modifier.DEFAULT);
    }
    public get isDecorated(){
        return Modifier.has(this.flags,Modifier.DECORATED);
    }
    public get isAbstract(){
        return Modifier.has(this.flags,Modifier.ABSTRACT);
    }

    constructor(value:Function){
        var module = system.modules['runtime/globals'];
        var reflection = value['__reflection'];
        var initializer = value['__initializer'];
        var decorator = value['__decorator'];
        delete value['__reflection'];
        delete value['__initializer'];
        delete value['__decorator'];
        if(reflection){
            module = reflection.module;
        }
        super(module,value.name);

        Object.defineProperty(this,'original',{
            value        : value
        });
        Object.defineProperty(this,'value',{
            configurable : true,
            value        : value
        });
        Object.defineProperty(this,'members',{
            enumerable  : true,
            value       : Object.create(null)
        });

        if(value.prototype.__proto__){
            Class.extend(value,value.prototype.__proto__.constructor);
        }
        if(reflection && reflection.parent){
            Class.extend(value,reflection.parent);
        }

        Object.getOwnPropertyNames(this.value).forEach(name=>{
            if(name!='arguments' && name!='caller' && name!='prototype') {
                this.getMember(name, Modifier.PUBLIC | Modifier.STATIC, true)
            }
        });
        Object.getOwnPropertyNames(this.value.prototype).forEach(name=>{
            this.getMember(name,Modifier.PUBLIC, true)
        });
        Object.defineProperty(this.members,this.name,{
            value : this
        });
        if(decorator){
            Object.defineProperty(this,'value',{
                configurable : true,
                value        : decorator((t,n,f,dt,rt,d,p,e,i)=>{
                    return this.decorate(t,n,f,dt,rt,d,p,e,i);
                },Type.get) || this.value
            });
            if(this.inheritance){
                Class.extend(this.value,this.inheritance.class.value);
            }
        }
        if(initializer){
            initializer(value.prototype.__proto__.constructor);
        }
    }

    public getMembers(filter?:(m:Member)=>boolean){
        var members = [];
        for(var m in this.members){
            if(!filter || filter(this.members[m])){
                members.push(this.members[m])
            }
        }
        return members;
    }
    public getConstructor():Constructor{
        return <Constructor>this.members[':constructor'];
    }
    public getMember(name,flags=0,descriptor:PropertyDescriptor|boolean=false):Member{
        var isStatic = Modifier.has(flags,Modifier.STATIC);
        var key = `${isStatic ? '.':':'}${name}`;
        var member = this.members[key];
        if(!member && !!descriptor){
            var scope  = isStatic?this.value:this.value.prototype;
            var desc:PropertyDescriptor;
            if(typeof descriptor=='object'){
                Object.defineProperty(scope,name,desc = descriptor);
            }else
            if(descriptor){
                desc = Object.getOwnPropertyDescriptor(scope,name)
            }
            if(!desc){return}
            if(isStatic){
                if(name!='arguments' && name!='caller' && name!='prototype'){
                    if(typeof desc.value=='function'){
                        member = new Method(this,name,flags,desc)
                    }else{
                        member = new Property(this,name,flags,desc)
                    }
                }
            }else{
                if(typeof desc.value=='function'){
                    if(name=='constructor'){
                        member = new Constructor(this,name,flags,desc)
                    } else {
                        member = new Method(this,name,flags,desc)
                    }
                }else{
                    member = new Property(this,name,flags,desc)
                }
            }
            Object.defineProperty(this.members,key,{
                enumerable : true,
                value : member
            });
        }
        return member;
    }

    /**
     * @internal
     */
    public decorate(type,name,flags,designType,returnType,decorators,parameters,inheritance,interfaces){
        var name = name||"constructor";
        var decorateMember = (member:Declaration,type:any,params:any[]):any => {
            var decorator:any = type;
            if(typeof type =="function"){
                decorator = new type(...params);
            }
            if(typeof decorator == 'function'){
                if(member instanceof Constructor){
                    let value = decorator(this.value);
                    if(typeof value =='function' && value!==this.value){
                        Object.defineProperty(this,'value',{
                                configurable : true,
                                value        : value
                        });
                    }
                }else
                if(member instanceof Member){
                    let old = member.descriptor;
                    let value = decorator(member.scope,member.name,old);
                    if(typeof value =='object' && (
                        old.configurable    != value.configurable||
                        old.enumerable      != value.enumerable||
                        old.writable        != value.writable||
                        old.value           != value.value||
                        old.get             != value.get||
                        old.set             != value.set
                    )){
                        member.descriptor = value;
                    }
                }else
                if(member instanceof Parameter){
                    decorator(member.owner.scope,member.owner.name,member.index);
                }
            }else
            if(decorator instanceof Decorator){
                if(member instanceof Constructor){
                    let value = decorator.decorate(member);
                    if(typeof value =='function' && value!==this.value){
                        Object.defineProperty(this,'value',{
                            configurable : true,
                            value        : value
                        });
                    }
                }else
                if(member instanceof Member){
                    let old = member.descriptor;
                    let value = decorator.decorate(member);
                    if(typeof value =='object' && (
                            old.configurable    != value.configurable||
                            old.enumerable      != value.enumerable||
                            old.writable        != value.writable||
                            old.value           != value.value||
                            old.get             != value.get||
                            old.set             != value.set
                        )){
                        member.descriptor = value;
                    }
                }else{
                    decorator.decorate(member);
                }
            }else{
                console.info(decorator);
            }
            return decorator;
        };
        var member = this.getMember(name,flags);
        if(!member){
            member = this.getMember(name,flags,{
                enumerable      :true,
                writable        :true,
                configurable    :true,
                value           :null
            })
        }
        Object.defineProperty(member,'type',{
            enumerable      : true,
            writable        : true,
            configurable    : true,
            value           : Type.get(designType)
        });
        if(member instanceof Method){
            if(parameters && parameters.length){
                Object.defineProperty(member,'parameters',{
                    enumerable      : true,
                    writable        : true,
                    configurable    : true,
                    value           : parameters.map((p,i)=>{
                        var decorators = p[3];
                        var parameter = new Parameter(member,p[0],i,p[1],Type.get(p[2]));
                        if(decorators && decorators.length){
                            Object.defineProperty(parameter,'decorators',{
                                enumerable      : true,
                                writable        : true,
                                configurable    : true,
                                value           : decorators
                                    .map((d:any[])=>decorateMember(parameter,d.shift(),d))
                                    .filter(d=>(d instanceof Decorator))
                            });
                        }
                        return parameter;
                    })
                });
            }
            if(member instanceof Constructor){
                Object.defineProperty(member,'returns',{
                    enumerable      : true,
                    writable        : true,
                    configurable    : true,
                    value           : Type.get(this.value)
                });
                if(interfaces && interfaces.length){
                    Object.defineProperty(this,'interfaces',{
                        enumerable      : true,
                        writable        : true,
                        configurable    : true,
                        value           : interfaces.map(i=>Type.get(i))
                    });
                }
                if(inheritance && inheritance.length){
                    Object.defineProperty(this,'inheritance',{
                        configurable    : true,
                        value           : Type.get(inheritance[0])
                    });
                }
            }else{
                Object.defineProperty(member,'returns',{
                    enumerable      : true,
                    writable        : true,
                    configurable    : true,
                    value           : Type.get(returnType)
                });
            }
        }
        if(decorators && decorators.length){
            Object.defineProperty(member,'decorators',{
                enumerable      : true,
                writable        : true,
                configurable    : true,
                value           : decorators
                    .map((d:any[])=>decorateMember(member,d.shift(),d))
                    .filter(d=>(d instanceof Decorator))
            });
        }
        return this.value;
    }

    public toString(){
        return `Class(${this.id})`
    }
    private inspect(){
        return this.toString();
    }
}