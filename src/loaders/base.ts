import {Path} from "../helpers";
import {IEmitter} from "../events";
import {Module} from "../reflect/module";
import {SystemModule} from "../system";

declare global {
    interface System extends IEmitter {
        root:string;
        url:string;
        modules:Module;
    }
}

export abstract class Loader {
    protected abstract detectRoot():void;
    protected abstract loadModule(id:string,url:string):Promise<any>;

    private registrations:any;
    private reflection:symbol;

    constructor(reflection:symbol){
        if(!system.root){
            this.detectRoot();
            Object.defineProperty(system,'root',{
                enumerable:true,
                configurable:false,
                writable:false,
                value:Path.resolve(Path.dirname(system.url),'..')
            });
        }
        Object.defineProperty(this,'reflection',{
            value:reflection
        });
        Object.defineProperty(this,'registrations',{
            value:Object.create(null)
        });
    }

    public import(name:string,parent:Module=system.module):Promise<any>{
        return this.doImport(name,parent);
    }

    public register(name:string,requires:string[],definer:Function):any{
        this.registrations[name] = {requires,definer};
    }

    /**
     * @internal
     */
    private doImport(name:string,parent:Module):Promise<any>{
        return this.doLoadModule(name).then(r=>this.doDefineModules()).then((modules:SystemModule[])=>{
            modules.forEach(m=>m.resolve());
            SystemModule.get(name).execute();
            modules.forEach(m=>m.execute());
            modules.forEach((m:SystemModule)=>{
                Object.defineProperty(m,'parent',{
                    enumerable      : true,
                    configurable    : false,
                    writable        : false,
                    value           : parent
                });
                Object.setPrototypeOf(m,Module.prototype);
                Object.defineProperty(system.modules,m.name,{
                    enumerable      :true,
                    configurable    :false,
                    writable        :false,
                    value           :m.exports
                });
                SystemModule.remove(m.name);
                m.initialize(this.reflection);
            });
        });
    }

    private doLoadModule(id:string):Promise<any>{
        this.registrations[id] = true;
        var url = Path.resolve(system.root,`${id}.js`);
        return this.loadModule(id,url).then(m=>{
            this.registrations[id].url = url;
            return this.doLoadDependencies()
        })
    }
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
    private doDefineModules():any[]{
        return Object.keys(this.registrations).map(name=>{
            var m = this.registrations[name];
            delete this.registrations[name];
            var sm = SystemModule.add(name,m.requires,m.definer)
            Object.defineProperty(sm,'url',{
                value:m.url
            });
            return sm;
        });
    }
}
