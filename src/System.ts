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
            Object.defineProperty(global,'require', <PropertyDescriptor>{
                value: require
            });
        }
        return system;
    }
}

const System = Ecmal.run();

