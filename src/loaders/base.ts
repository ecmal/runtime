import {Path} from "../helpers";
import {Module} from "../module";

export abstract class Loader {

    protected abstract detectRoot():void;
    protected abstract loadModule(id:string,url:string):Promise<any>;

    private registrations:any;

    constructor(){
        if(!system.root){
            this.detectRoot();
            Object.defineProperty(system,'root',{
                enumerable:true,
                configurable:false,
                writable:false,
                value:Path.resolve(Path.dirname(system.url),'..')
            });
        }
        Object.defineProperty(this,'registrations',{
            value:Object.create(null)
        });
    }

    public import(name:string,parent?:Module):Promise<any>{
        if(system.modules[name]){
            var m = <Module>system.modules[name];
            m.execute();
            return Promise.resolve(m.exports)
        }else{
            return this.doImport(name,parent||system.module).then(m=>m.exports);
        }

    }
    public register(name:string,requires:string[],definer:Function):any{
        this.registrations[name] = {requires,definer};
    }

    /**
     * @internal
     */
    private doImport(name:string,parent:Module):Promise<any>{
        return this.doLoadModule(name).then(r=>this.doDefineModules()).then((modules:Module[])=>{
            modules.forEach(m=>m.resolve());
            Module.get(name).execute();
            modules.forEach(m=>m.execute());
            modules.forEach((m:Module)=>{
                Object.defineProperty(m,'parent',{
                    enumerable      : true,
                    configurable    : false,
                    writable        : false,
                    value           : parent
                });
            });
            return system.modules[name];
        });
    }
    /**
     * @internal
     */
    private doLoadModule(id:string):Promise<any>{
        this.registrations[id] = true;
        var url = Path.resolve(system.root,`${id}.js`);
        return this.loadModule(id,url).then(m=>{
            this.registrations[id].url = url;
            return this.doLoadDependencies()
        })
    }
    /**
     * @internal
     */
    private doLoadDependencies():Promise<any>{
        var requirements = [];
        for(var id in this.registrations){
            var reg = this.registrations[id];
            if(reg.requires && reg.requires.length){
                reg.requires = reg.requires.map(r=>{
                    if(r[0]=='.'){
                        return Path.resolve(Path.dirname(id),r)
                    }else{
                        return r;
                    }
                });
                reg.requires.forEach(r=>{
                    if(!this.registrations[r] && !system.modules[r]){
                        requirements.push(r)
                    }
                })
            }
        }
        return Promise.all(requirements.map(r=>this.doLoadModule(r)));
    }
    /**
     * @internal
     */
    protected doDefineModules():any[]{
        return Object.keys(this.registrations).map(name=>{
            var m = this.registrations[name];
            delete this.registrations[name];
            var sm = Module.add(name,m.requires,m.definer)
            Object.defineProperty(sm,'url',{
                enumerable      : true,
                configurable    : false,
                writable        : false,
                value           : m.url || system.url
            });
            return sm;
        });
    }
}
