

namespace Ecmal {
    declare var __filename:string;
    declare var document:any;
    declare var global:any;
    declare var process:any;
    declare var XMLHttpRequest:any;
    declare var Event:any;
    declare function require(path:string):any;
    export abstract class Loader {
        public main:string;
        public runtime:string;
        public current:Module;
        public modules:Modules;
        public options:any;

        constructor(){
            this.options = {};
            this.modules = {};
        }
        get base():string{
            if(!this.options.base){
                this.options.base = Path.resolve(Path.dirname(this.runtime),'../');
            }
            return this.options.base;
        }
        set base(v:string){
            this.options.base=v;
        }
        abstract eval(url):Promise<string>;
        abstract read(url):Promise<string>;

        get(url){
            var id = url.replace(this.base+'/','').replace(/^(.*)\.js$/g,'$1').toLowerCase();
            var module:Module =this.modules[id];
            if(!module){
                module = this.modules[id] = {id,url};
            }
            return module;
        }
        register(name:string,dependencies:string[],executable:any){
            this.current.dependencies = dependencies;
            this.current.executable = executable;
        }
        import(name){
            var url = Path.resolve(this.base,name+'.js');
            var dir = Path.dirname(url);
            var mod = this.get(url);
            if(mod.exports){
                return Promise.resolve(mod.exports)
            }else{
                return this.fetch(mod).then((m:Module)=>this.define(m)).then((m:Module)=>m.exports);
            }
        }
        fetch(module:Module):Promise<Module> {
            var promise = Promise.resolve(module);
            if(typeof module.source=='undefined' && !module.defined){
                module.source = '';
                promise = this.read(module)
                    .then(()=>this.eval(module))
                    .then(()=>{
                        var dir = Path.dirname(module.url);
                        var dependencies:Promise<Module>[] = module.dependencies.map((d):Promise<Module>=>{
                            var path = d+'.js';
                            if(path[0]=='.'){
                                path = Path.resolve(dir,path)
                            }else{
                                path = Path.resolve(this.base,path);
                            }
                            return this.fetch(this.get(path));
                        });
                        return Promise.all(dependencies).then((modules:Module[]):Module=>{
                            for(var d=0;d<modules.length;d++){
                                module.dependencies[d] = modules[d];
                                modules[d].parent = module;
                            }
                            return module;
                        });
                    });
            }
            return promise;
        }
        define(module:Module){
            if(module.defined){
                return Promise.resolve(module);
            }else{
                module.defined = true;
                module.exports = {};
                var definer:any = new module.executable((name,val)=>{
                    module.exports[name] = val;
                });
                if(module.dependencies.length){
                    var promises:Promise<any>[] = module.dependencies.map((m):any=>this.define(m).then(m=>m.exports));
                    return Promise.all(promises).then((exps:any)=>{
                        for(var i=0;i<exps.length;i++){
                            definer.setters[i](exps[i])
                        }
                        definer.execute();
                        return module;
                    })
                }else{
                    definer.execute();
                    return Promise.resolve(module)
                }
            }
        }
    }
    export class ServerSideLoader extends Loader {
        constructor(){
            super();
        }
        static get FS(){
            return Object.defineProperty(this, 'FS', <PropertyDescriptor>{
                value: require('fs')
            }).FS
        }
        static get VM(){
            return Object.defineProperty(this, 'VM', <PropertyDescriptor>{
                value : require('vm')
            }).VM
        }
        get runtime():string {
            return __filename;
        }
        get main():string {
            return process.argv[2];
        }
        get(name){
            var mod = super.get(name);
            if(mod.id.indexOf('node/')==0){
                mod.defined = true;
                mod.exports = require(mod.id.substring(5));
                return mod;
            }else{
                return mod;
            }
        }
        read(module:Module):Promise<Module> {
            return new Promise((accept, reject)=> {
                ServerSideLoader.FS.readFile(module.url, 'utf8', function (err, data) {
                    if (err){
                        reject(err)
                    }else{
                        module.source = data;
                        accept(module)
                    }
                });
            });
        }
        eval(module:Module):Promise<Module> {
            this.current = module;
            var context = {
                System      : global['System'],
                Buffer      : global['Buffer'],
                require     : global['require'],
                process     : global['process'],
                console     : global['console'],
                __filename  : module.url,
                __dirname   : Path.dirname(module.url)
            };
            ServerSideLoader.VM.runInNewContext(module.source,context,{
                filename : module.url
            });
            this.current = null;
            return Promise.resolve(module);
        }
    }
    export class ClientSideLoader extends Loader {
        get script():any{
            return document.querySelector('script[main]');
        }
        get runtime():string{
            return this.script.src;
        }
        get main():string{
            return this.script.getAttribute('main');
        }
        read(module:Module):Promise<Module>{
            return new Promise((accept, reject)=> {
                var oReq = new XMLHttpRequest();
                oReq.addEventListener('load', (e:any)=>{
                    module.source = oReq.responseText;
                    accept(module);
                });
                oReq.addEventListener("error", e=>{
                    reject(e)
                });
                oReq.open("get", module.url, true);
                oReq.send();
            })
        }
        eval(module:Module):Promise<Module> {
            this.current = module;
            var aHead = document.querySelector('head');
            var aScript = document.createElement('script');
            aScript.type = 'text/javascript';
            aScript.id = module.id;
            aScript.text = module.source+'\n//# sourceURL='+module.url;
            aHead.appendChild(aScript);
            this.current = null;
            return Promise.resolve(module);
        }
    }
}