import {Decorator} from "runtime/decorators";
import {
    Member,
    Method,
    Constructor,
    Modifier,
    Class
} from "runtime/reflect/class";


export function Cached(){
    return (target,key,desc)=>{
        var method = desc.get;
        return {
            configurable:true,
            get(){
                return Object.defineProperty(this, key, <any> {
                    enumerable: false,
                    configurable: true,
                    writable: true,
                    value:  method.call(this)
                })[key];
            }
        };
    }
}


export class Bound extends Decorator {
    decorate(target: Member): any {
        if(target instanceof Constructor){
            console.info(`Bounded(${target.toString()})`);
            target.owner.getMember('getBoundedFunctions',Modifier.STATIC,{
                configurable:true,
                value(){
                    return this;
                }
            });
            var NewClass = new Function(`
                console.info("OVERRIDED",this.constructor.original);
                this.constructor.original.apply(this,arguments)
            `);

            Class.extend(NewClass,target.owner.original);
            NewClass['original'] = target.owner.original;

            return NewClass;
        }else
        if(target instanceof Method){
            console.info(`Bounded(${target.toString()})`);
            var method = <Method>target;
            target.descriptor = {
                configurable:true,
                get(){
                    return Object.defineProperty(this, method.name, <any> {
                        enumerable: false,
                        configurable: true,
                        writable: true,
                        value:  method.original.value.bind(this)
                    })[method.name];
                }
            };
        }else{
            throw new Error(`Invalid Bound annotation target ${target.toString()}`);
        }
    }
}

console.info(module.url);