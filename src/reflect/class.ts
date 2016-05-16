import {Declaration} from "./declaration";
import {Decorator, Annotator, Metadata} from "../decorators";
declare global {
    interface Function {
        class:Class;
    }
}
export interface ClassMap {
    [name:string]:Module;
}

enum MemberModifiers {
    None        = 0,
    Public      = 8,
    Private     = 16,
    Protected   = 32,
    Static      = 64,
    Abstract    = 128,
}

enum MemberType {
    PROPERTY    = 142,
    METHOD      = 144,
    GETTER      = 146,
    SETTER      = 147,
    CLASS       = 217
}

export class Type {
    static get(reference:string|Function|Type,...params):Type{
        if(reference instanceof Type){
            return reference;
        }else{
            return new Type(reference,params);
        }
    }
    constructor(value,params){
        if(typeof value=='string'){
            Object.defineProperty(this,'module',{
                enumerable      : true,
                configurable    : true,
                writable        : false,
                value           : value
            });
            Object.defineProperty(this,'interface',{
                enumerable      : true,
                configurable    : true,
                writable        : false,
                value           : params[0]
            });
        }else{
            Object.defineProperty(this,'reference',{
                enumerable      :true,
                configurable    :true,
                writable        :false,
                value           :value
            });
            Object.defineProperty(this,'parameters',{
                enumerable      : true,
                configurable    : true,
                writable        : false,
                value           : params
            });
        }
    }
}
export class Modifier {

    static NONE      = 0;
    static EXPORT    = 2;
    static AMBIENT   = 4;
    static PUBLIC    = 8;
    static PRIVATE   = 16;
    static PROTECTED = 32;
    static STATIC    = 64;
    static ABSTRACT  = 128;
    static ASYNC     = 256;

    static has(a:number,b:number):boolean{
        return (a&b)==b;
    }

}
export class Parameter extends Declaration{
    public owner:Method;
    public type:Type;
    public flags:number;

    constructor(owner:Method,name:string,flags:number,type:Type){
        super(name);
        Object.defineProperty(this,'owner',{
            enumerable      : true,
            writable        : false,
            configurable    : false,
            value           : owner
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

}
export class Member extends Declaration {
    public id:string;
    public flags:number;
    public owner:Class;
    public decorators:Decorator[];
    public original:PropertyDescriptor;
    public set descriptor(v:PropertyDescriptor){
        Object.defineProperty(this.scope,this.name,v)
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
        return this.isStatic?this.owner.value:this.owner.value.prototype
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
}
export class Property extends Member {}
export class Method extends Member {}
export class Constructor extends Method {}
export class Class extends Declaration {
    static isClass(target:Function){
        return target.class instanceof Class;
    }
    static get map():ClassMap{
        return Object.defineProperty(this,'map',{
            value:Object.create(null)
        })
    }
    
    public id:string;
    public module:Module;
    public value:Function;

    public members:{[name:string]:Member};
    public decorators:Decorator[];

    constructor(module:Module,name:string,value:Function){
        super(name);

        Object.defineProperty(this,'module',{
            enumerable  : true,
            value       : module
        });
        Object.defineProperty(this,'value',{
            value       : value
        });
        Object.defineProperty(this,'members',{
            value       : Object.create(null)
        });
        Object.defineProperty(this,'id',{
            enumerable  : true,
            value       : `${this.module.name}#${this.name}`
        });
        Object.defineProperty(Class.map,this.id,{
            enumerable  : true,
            value       : this
        });
        delete this.value.name;
        delete this.value.length;

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
        function createAnnotator(type:any,params:any[]):Annotator {
            var decorator:Annotator;
            if(Class.isClass(type)){
                decorator = new type(...params);
            }else
            if(typeof type =="function"){
                decorator = type(...params);
            }
            if(decorator instanceof Annotator){
                return decorator;
            }else
            if(typeof decorator == 'function'){
                return new Decorator(type,decorator);
            }else{
                return new Metadata(type.name,<any>decorator);
            }
        }
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
            if(member instanceof Constructor){
                Object.defineProperty(member,'returns',{
                    enumerable      : true,
                    writable        : true,
                    configurable    : true,
                    value           : Type.get(this.value)
                });
                if(interfaces && interfaces.length){
                    Object.defineProperty(member,'interfaces',{
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
            if(parameters && parameters.length){
                Object.defineProperty(member,'parameters',{
                    enumerable      : true,
                    writable        : true,
                    configurable    : true,
                    value           : parameters.map(p=>{
                        var decorators = p[3];
                        var parameter = new Parameter(member,p[0],p[1],Type.get(p[2]));
                        if(decorators && decorators.length){
                            Object.defineProperty(parameter,'decorators',{
                                enumerable      : true,
                                writable        : true,
                                configurable    : true,
                                value           : decorators.map((d:any[])=>{
                                    var decorator:Annotator = createAnnotator(d.shift(),d);
                                    decorator.decorate(parameter);
                                    return decorator;
                                })
                            });
                        }
                        return parameter;
                    })
                });
            }
            if(decorators && decorators.length){
                Object.defineProperty(member,'decorators',{
                    enumerable      : true,
                    writable        : true,
                    configurable    : true,
                    value           : decorators.map((d:any[])=>{
                        var decorator:Annotator = createAnnotator(d.shift(),d);
                        decorator.decorate(member);
                        return decorator;
                    })
                });
            }
        }
    }
}