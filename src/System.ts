namespace Reflect {
    const METADATA:symbol = Symbol('metadata');

    var module:any;

    export function decorate(decorators, target, key, desc) {
        decorators.push(Reflect.metadata('design:module', {
            id   : module.id,
            url  : module.url,
            deps : module.dependencies && module.dependencies.length
                ? module.dependencies.map(m=>m.id)
                : []
        }));
        var c = key?(desc?4:3):2, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    export function setCurrentModule(current){
        module = current;
    }

    export function metadata(name,value){
        return (target,key,desc)=>{
            //console.info(target,key,desc,name,value);
            var metadata = target[METADATA];
            if(!metadata){
                metadata = target[METADATA] = {};
            }
            if(key){
                var field = metadata[Symbol.for(key)];
                if(!field){
                    field = metadata[Symbol.for(key)] = {};
                }
                metadata = field;
            }
            metadata[name] = value;
        }
    }
    export function getDesignType(target,key):any{
        return getMetadata(target,key,'design:type')||Object;
    }
    export function getReturnType(target,key):any{
        return getMetadata(target,key,'design:returntype')||Object;
    }
    export function getParamTypes(target,key):any[]{
        return getMetadata(target,key,'design:paramtypes')||[];
    }
    export function getMetadata(target,key,name){
        var type,metadata = target[METADATA];
        if(metadata){
            if(key){
                var field = metadata[Symbol.for(key)];
                if(field){
                    type = field[name];
                }
            }else{
                type = metadata[name];
            }
        }
        return type;
    }
}

namespace Ecmal {
    declare var window:any;
    declare var global:any;
    declare var process:any;
    declare function require(path:string):any;
    export class Runtime {
        static get environment(){
            if(typeof window!='undefined'){
                return Environment.CLIENT;
            } else
            if(typeof process=='object'){
                return Environment.SERVER;
            }
        }
    }
    export class System {
        loader:Loader;
        constructor(){
            switch(Runtime.environment){
                case Environment.SERVER:
                    this.loader = new ServerSideLoader();
                break;
                case Environment.CLIENT:
                    this.loader = new ClientSideLoader();
                break;
            }
        }
        config(options:any){
            if(options.base){
                this.loader.base = options.base;
            }
        }
        register(name,deps,exec){
            if(Array.isArray(name)){
                this.loader.register('@',name,deps);
            }else{
                this.loader.register(name,deps,exec);
            }
        }
        import(name){
            return this.loader.import(name)
        }
        bundle(content){
            this.loader.bundle(content);
        }
        get modules(){
            var modules = {};
            Object.keys(this.loader.modules).forEach(k=>{
                modules[k] = this.loader.modules[k].exports;
            });
            return modules;
        }
    }
    export function run():System {
        var system = new Ecmal.System();
        /*if(system.loader.main){
            system.import(system.loader.main).then(Main=>{
                return "OK";
            }).catch(e=>console.log(e.stack));
        }*/
        if(typeof global!='undefined'){
            Object.defineProperty(global,'System', <PropertyDescriptor>{
                value: system
            });
            Object.defineProperty(global,'Reflect', <PropertyDescriptor>{
                value: Reflect
            });
            Object.defineProperty(global,'require', <PropertyDescriptor>{
                value: require
            });
        }
        return system;
    }
}

const System = Ecmal.run();

