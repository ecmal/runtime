namespace Ecmal {
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
    }
    export function run():System {
        var system = new Ecmal.System();
        /*if(system.loader.main){
            system.import(system.loader.main).then(Main=>{
                return "OK";
            }).catch(e=>console.log(e.stack));
        }*/
        if(typeof global!='undefined'){
            Object.defineProperty(global,'System',{
                value : system
            });
            Object.defineProperty(global,'require',{
                value : require
            })
        }
        return system;
    }
}

const System = Ecmal.run();

