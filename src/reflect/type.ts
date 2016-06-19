import {Interface} from "./interface";
import {Class} from "./class";

export class Type {
    static get(reference:Function|Interface|Type,...params):Type{
        if(reference){
            if(reference instanceof Type){
                return reference;
            }else{
                return new Type(reference,params.map(p=>Type.get(p)));
            }
        }
    }
    public interface:Interface;
    public parameters:Type[];
    public get isParametrized():boolean{
        return this.parameters && this.parameters.length>0;
    }
    public get isClass():boolean{
        return (this.interface instanceof Class);
    }
    public get class():Class{
        if(this.isClass){
            return <Class>this.interface;
        }
    }
    public get parent():Type{
        if(this.isClass){
            return this.class.parent.type;
        }
    }
    constructor(value:Function|Interface|Type,params:Type[]){
        if(value instanceof Function){
            Object.defineProperty(this,'interface',{
                enumerable      :true,
                configurable    :true,
                get(){
                    return Object.defineProperty(this,'interface',{
                        enumerable      :true,
                        configurable    :true,
                        value           :(<Function>value).class
                    }).interface;
                }
            });
        }else{
            Object.defineProperty(this,'interface',{
                enumerable      : true,
                configurable    : true,
                value           : value
            })
        }
        Object.defineProperty(this,'parameters',{
            enumerable      : true,
            configurable    : true,
            writable        : false,
            value           : params
        });
    }

    public is(type:Interface){
        if(type instanceof Class){
            return this.isExtend(type);
        }else{
            return this.isImplement(type);
        }
    }
    public isExtend(type:Class){
        var ref = this.class;
        while(ref){
            if(ref.id == type.id){
                return true;
            }else{
                ref = ref.parent;
            }
        }
        return false;
    }
    public isImplement(type:Interface){
        var ref:Class = this.class;
        while(ref){
            if(ref.interfaces){
                for(var impl of ref.interfaces){
                    if(impl.interface.id == type.id){
                        return true;
                    }
                }
            }
            ref = ref.parent;
        }
        return false;
    }
}