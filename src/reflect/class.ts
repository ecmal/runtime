import {Declaration} from "./declaration";

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
    public decorators:Decorator[];
    constructor(owner:Class,name:string,flags:number,create:boolean){
        super(name);
        var isStatic = Modifier.has(flags,Modifier.STATIC);
        var isPublic = Modifier.has(flags,Modifier.PUBLIC);
        var scope = isStatic?owner.value:owner.value.prototype;
        Object.defineProperty(this,'flags',{
            get(){return flags},
            set(v){flags=v}
        });
        if(create){
            Object.defineProperty(scope,name,{
                enumerable   : isPublic,
                writable     : true,
                configurable : true,
                value        : null
            });
        }
    }
    public decorate(decorators:Decorator[]){
        Object.defineProperty(this,'decorators',{
            enumerable      : true,
            configurable    : true,
            writable        : false,
            value           : decorators
        });
    }
}
export class Class extends Declaration {
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
    public getMember(name,flags=0,create=false){
        var isStatic = Modifier.has(flags,Modifier.STATIC);
        var key = `${isStatic ? '.':':'}${name}`;
        var member = this[key];
        if(!member){
            var scope = isStatic?this.value:this.value.prototype;
            var desc  = Object.getOwnPropertyDescriptor(scope,name);
            if(desc){
                member = this.members[key] = new Member(this,name,flags,false);
            }else
            if(create){
                member = this.members[key] = new Member(this,name,flags,true);
            }
            return member;
        }
    }
    public decorate(decorators:Decorator[]){
        Object.defineProperty(this,'decorators',{
            enumerable      : true,
            configurable    : true,
            writable        : false,
            value           : decorators
        });
    }
}