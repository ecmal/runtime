import {Declaration} from "./declaration";
import {Class} from "./class";
import {Decorator} from "../decorators";
import {Modifier} from "./modifier";
import {Type} from "./type";

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
    public get key():string{
        return `${this.isStatic?'.':':'}${this.name}`;
    }
    public get isStatic():boolean{
        return Modifier.has(this.flags,Modifier.STATIC);
    }
    public get isPublic():boolean{
        return Modifier.has(this.flags,Modifier.PUBLIC);
    }
    public get isProtected():boolean{
        return Modifier.has(this.flags,Modifier.PROTECTED);
    }
    public get isPrivate():boolean{
        return Modifier.has(this.flags,Modifier.PRIVATE);
    }
    public get isAbstract():boolean{
        return Modifier.has(this.flags,Modifier.ABSTRACT);
    }
    public get isDecorated():boolean{
        return Modifier.has(this.flags,Modifier.DECORATED);
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
            value       : `${this.owner.id}${this.key}`
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