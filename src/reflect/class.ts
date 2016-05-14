import {Declaration} from "./declaration";
import {Decorator} from "../decorators";
declare global {
    interface Function {
        class:Class;
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

    static get map():{[id:string]:Class}{
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
}