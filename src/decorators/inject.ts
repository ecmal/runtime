import {Mirror} from "../reflect";
export const CONTEXT = Symbol('target');
export function inject(target:Object,key:string,desc?:PropertyDescriptor):any{
    let mirror = Mirror.get(target,key);
    if(mirror && mirror.isField()){
        let name = mirror.getName();
        let type = mirror.getType();
        if(!desc){
            desc = mirror.getDescriptor() || {
                writable     : true,
                configurable : true,
                enumerable   : false
            };
        }
        let {writable,configurable,enumerable} = desc;        
        delete desc.writable;
        delete desc.value;
        desc.get = function(){
            let value = Object.create(type.prototype,{
                [CONTEXT]:{value:{target:this,property:name}}
            });
            value = type.call(value)||value;
            Object.defineProperty(this,name,{
                writable,
                configurable,
                enumerable,
                value
            });
            return value;
        };
        desc.set = function(value){
            if(value instanceof type){
                Object.defineProperty(this,name,{
                    writable,
                    configurable,
                    enumerable,
                    value
                });
            }else{
                throw TypeError('Invalid property type');
            }
        }
        return desc;
    }else{
        throw new Error(`invalid injection target`);
    }
}