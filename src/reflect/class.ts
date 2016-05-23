import {Declaration} from "./declaration";
import {Decorator} from "../decorators";

declare global {
    interface Function {
        class:Class;
    }
}
export interface ClassMap {
    [name:string]:Module;
}

export class Interface extends Declaration {
    public id:string;
    public module:Module;
    public implementations:Class[];
    constructor(module:Module,name:string){
        super(name);
        Object.defineProperty(this,'module',{
            enumerable  : true,
            value       : module
        });
        Object.defineProperty(this,'id',{
            enumerable  : true,
            value       : `${this.module.name}#${this.name}`
        });
        Object.defineProperty(this,'implementations',{
            enumerable  : true,
            value       : []
        });
        Object.defineProperty(system.classes,this.id,{
            enumerable  : true,
            value       : this
        });
    }
}
export class Type {
    static get(reference:string|Function|Type,...params):Type{
        if(reference instanceof Type){
            return reference;
        }else{
            return new Type(reference,params);
        }
    }

    reference:Class;
    parameters:any[];

    constructor(value,params){
        Object.defineProperty(this,'reference',{
            enumerable      :true,
            configurable    :true,
            get(){
                if(value instanceof Function){
                    return value.class
                }else{
                    return value;
                }
            }
        });
        Object.defineProperty(this,'parameters',{
            enumerable      : true,
            configurable    : true,
            writable        : false,
            value           : params
        });
    }
}
export class Modifier {
    
    static NONE              = 0;
    static STATIC            = 1;   
    static PUBLIC            = 2;   
    static PROTECTED         = 4;   
    static PRIVATE           = 8;   
    static DECORATED         = 16;  
    static ABSTRACT          = 32;  
    static EXPORT            = 64;  
    static DEFAULT           = 128; 
   


    static has(a:number,b:number):boolean{
        return (a&b)==b;
    }

}
export class Parameter extends Declaration {

    public id:string;
    public owner:Method;
    public index:number;
    public type:Type;
    public flags:number;
    public decorators:Decorator[];

    constructor(owner:Method,name:string,index:number,flags:number,type:Type){
        super(name);
        Object.defineProperty(this,'owner',{
            enumerable      : true,
            writable        : false,
            configurable    : false,
            value           : owner
        });
        Object.defineProperty(this,'index',{
            enumerable      : true,
            writable        : false,
            configurable    : false,
            value           : index
        });
        Object.defineProperty(this,'id',{
            enumerable  : true,
            value       : `${this.owner.id}:${this.index}.${this.name}`
        });
        Object.defineProperty(this,'flags',{
            enumerable      : true,
            writable        : false,
            configurable    : false,
            value           : flags
        });
        Object.defineProperty(this,'type',{
            enumerable      : true,
            writable        : false,
            configurable    : false,
            value           : type
        });
    }
    public toString(){
        return `${this.constructor.name}(${this.id})`
    }
    private inspect(){
        return this.toString()
    }
}
export class Member extends Declaration {
    public id:string;
    public flags:number;
    public owner:Class;
    public decorators:Decorator[];
    public original:PropertyDescriptor;
    public type:Type;
    public set descriptor(v:PropertyDescriptor){
        var old = this.descriptor;
        var changed = false;
        for(var i in v){
            if(old[i]!==v[i]){
                changed = true;
            }
        }
        if(changed){
            //console.info("CHANGED",this.toString());
            Object.defineProperty(this.scope,this.name,v);
        }
    }
    public get descriptor():PropertyDescriptor{
        return Object.getOwnPropertyDescriptor(this.scope,this.name);
    }
    public get isStatic(){
        return Modifier.has(this.flags,Modifier.STATIC);
    }
    public get isPublic(){
        return Modifier.has(this.flags,Modifier.PUBLIC);
    }
    public get scope(){
        return this.isStatic?this.owner.value:this.owner.value.prototype;
    }
    constructor(owner:Class,name:string,flags:number,descriptor?:PropertyDescriptor){
        super(name);
        if(this.constructor == Member){
            throw new Error('Member is abstract class');
        }

        Object.defineProperty(this,'owner',{
            enumerable   : true,
            value        : owner
        });
        Object.defineProperty(this,'flags',{
            enumerable   : true,
            configurable : true,
            value        : flags
        });
        Object.defineProperty(this,'id',{
            enumerable  : true,
            value       : `${this.owner.id}${this.isStatic?'.':':'}${this.name}`
        });
        if(!this.original){
            Object.defineProperty(this,'original',{
                enumerable  : true,
                value       : this.descriptor||descriptor
            });
        }
        if(descriptor){
            this.descriptor = descriptor;
        }
    }
    public decorate(decorators:Decorator[]){
        if(!this.decorators){
            Object.defineProperty(this,'decorators',{
                enumerable      : true,
                configurable    : true,
                writable        : false,
                value           : []
            });
        }
        decorators.forEach(d=>{
            this.decorators.push(d);
            d.decorate(this);
        })
    }
    public toString(){
        return `${this.constructor.name}(${this.owner.name}${this.isStatic?'.':':'}${this.name})`
    }
    private inspect(){
        return this.toString()
    }
}
export class Property extends Member {}
export class Method extends Member {}
export class Constructor extends Method {}
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

    constructor(module:Module,name:string,value:Function){
        super(module,name);

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

        //delete this.value.name;
        //delete this.value.length;
        Object.getOwnPropertyNames(this.value).forEach(name=>{
            if(name!='arguments' && name!='caller' && name!='prototype' && name!='__decorator' && name!='__initializer') {
                this.getMember(name, Modifier.PUBLIC | Modifier.STATIC, true)
            }
        });
        Object.getOwnPropertyNames(this.value.prototype).forEach(name=>{
            this.getMember(name,Modifier.PUBLIC, true)
        });
        function getParents(target){
            function getParent(target){
                if(target.__proto__){
                    return target.__proto__.constructor;
                }else {
                    return null;
                }
            }
            var parent=target,parents=[];
            while(parent && parent.prototype){
                if(parent=getParent(parent.prototype)){
                    parents.push(parent)
                }
            }
            return parents;
        }
    }
    public getMember(name,flags=0,descriptor:PropertyDescriptor|boolean=false):Member{
        var isStatic = Modifier.has(flags,Modifier.STATIC);
        var key = `${isStatic ? '.':':'}${name}`;
        var member = this.members[key];
        if(!member){
            var scope  = isStatic?this.value:this.value.prototype;
            if(!!descriptor){
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
        }
        return member;
    }

    /**
     * @internal
     */
    public decorate(type,name,flags,designType,returnType,decorators,parameters,interfaces){
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
}