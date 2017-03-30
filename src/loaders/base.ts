import {Path} from "../helpers";
import {Module} from "../module";

export abstract class Loader {

    protected abstract detectRoot():void;
    protected abstract loadProject(id:string,url:string):Promise<any>;
    protected abstract loadModule(id:string,url:string):Promise<any>;
    protected current:string;
    protected registrations:any;
    protected projects:any;

    constructor(){
        if(System.root=='~'){
            this.detectRoot();
            Object.defineProperty(System,'root',{
                enumerable:true,
                configurable:false,
                writable:false,
                value:Path.resolve(Path.dirname(System.url),'../..')
            });
        }
        Object.defineProperty(this,'projects',{
            value:Object.create(null)
        });
        Object.defineProperty(this,'registrations',{
            value:Object.create(null)
        });
    }

    public import(name:string,parent?:Module):Promise<any>{
        let m = Module.get(name)
        if(m){
            return Promise.resolve(m);
        }else{
            return this.doImport(name).then(m=>m.exports);
        }
    }
    public register(name:string,requires:string[],definer:Function):any{
        if(Array.isArray(name)){
            definer = requires as any;
            requires = name as any;
            name = this.current;
        }
        this.registrations[name] = {requires,definer};
    }

    /**
     * @internal
     */
    private doImport(name:string):Promise<any>{
        return this.doLoadModule(name).then(r=>this.doDefineModules()).then((modules:Module[])=>{
            Module.get(name).execute();
            modules.forEach(m=>m.execute());
            return Module.get(name);
        })
    }
    /**
     * @internal
     */
    private doLoadProject(id:string):Promise<any>{
        if(!this.projects[id]){
            var url = Path.resolve(System.root,`${id}/package.json`);
            return this.loadProject(id,url).then(project=>{
                project.id = id;
                project.url = url;
                this.projects[id] = project;
                return project;
            });
        } else {
            return Promise.resolve(this.projects[id]);
        }
    }
    /**
     * @internal
     */
    private doLoadModule(name:string):Promise<any>{
        let loadModule = (id,bundle)=>{
            this.registrations[id] = true;
            var url = Path.resolve(System.root,`${bundle?bundle:id}.js`);
            return this.loadModule(id,url).then(m=>{
                try{
                    this.registrations[id] = m;
                    this.registrations[id].url = url;
                }catch(e){
                    console.info(id,url,e.message);
                }
                return this.doLoadDependencies();
            },e=>{
                let error = new Error(`Loading module "${id}" failed "${url}"`)
                error.stack +=`\nCause: ${e.stack}`;
                throw error;
            })
        };
        let [fullName,projectName,moduleName] = name.match(/^(@[a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_]+)(\/.*)?$/);
        return this.doLoadProject(projectName).then(project=>{
            let bundle = project.bundle?`${project.id}/index`:void 0;
            if(!moduleName){
                name = `${project.id}/${project.main.replace(/^(.*)\.js$/,'$1')||'index'}`;
            }
            return loadModule(name,bundle)
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
                    if(!this.registrations[r] && !Module.get(r)){
                        requirements.push(r)
                    }
                })
            }
        }
        return Promise.all(<any>requirements.map(r=>this.doLoadModule(r)));
    }
    /**
     * @internal
     */
    protected doDefineModules():any[]{
        return Object.keys(this.registrations).map(name=>{
            var m = this.registrations[name];
            delete this.registrations[name];
            var sm = Module.add(name,m.requires,m.definer);

            Object.defineProperty(sm,'url',{
                enumerable      : true,
                configurable    : false,
                writable        : false,
                value           : m.url || System.url
            });
            return sm;
        });
    }
}
