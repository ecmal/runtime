import {Member} from "./reflect/member";
import {Method} from "./reflect/method";
import {Property} from "./reflect/property";
import {Constructor} from "./reflect/constructor";

export class Decorator {
    public decorate(target:Member){}
}
export class Bound extends Decorator {
    decorate(target: Method): any {
        if(target instanceof Method){
            var method = target.original;
            var name = target.name;
            target.descriptor = {
                configurable:true,
                get(){
                    return Object.defineProperty(this, name, <any> {
                        enumerable      : false,
                        configurable    : true,
                        value           : method.value.bind(this)
                    })[name];
                }
            }
        }else{
            throw new Error(`Invalid Bound annotation target ${target.toString()}`);
        }
    }
}
export class Cached extends Decorator {
    static INSTANCES = Symbol('instances');
    static get(type, name?){
        if(type.metadata.singletone){
            name = name || 'default';
        }
        if(name){
            var instances = type[Cached.INSTANCES];
            if(!instances){
                instances = type[Cached.INSTANCES] = Object.create(null);
            }
            if(!instances[name]){
                instances[name] = new type.value();
            }
            return instances[name];
        }else{
            return new type.value();
        }
    }
    public named:string;
    public constructor(name?:string){
        super();
        this.named = name;
    }
    public decorate(target: Member): any {
        if(target instanceof Property){
            //console.info(`Cached(${target.toString()})`);
            try {
                let method = target.descriptor.get;
                let name = target.name;
                if(!method){
                    if(this.named){
                        let named = this.named;
                        method = function(){
                            return Cached.get(target.type.class,named);
                        }
                    }else{
                        method = function(){
                            return Cached.get(target.type.class);
                        }
                    }
                }
                return {
                    configurable: true,
                    get(){
                        return Object.defineProperty(this, name, <any> {
                            enumerable: false,
                            configurable: false,
                            writable: false,
                            value: method.call(this)
                        })[name];
                    }
                };
            }catch(ex){
                throw new Error(`Unable to Cache ${target.toString()}`);
            }
        }else
        if(target instanceof Constructor){
            target.owner.metadata.singletone = true;
        }else{
            throw new Error(`Invalid Cache annotation target ${target.toString()}`);
        }
    }
}