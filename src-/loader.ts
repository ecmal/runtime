namespace Runtime {
    declare var __filename: any;
    declare var __dirname: any;
    declare var require: any;
    declare var global: any;
    declare var window: any;
    declare var process: any;

    export class Loader {

        constructor(){
            this.load = this.load.bind(this)
            this.define = this.define.bind(this)
            this.eval = this.eval.bind(this)
        }
        static get global(){
            return Object.defineProperty(this,'global',<any>{
                value:(():any=>{
                    switch(this.platform){
                        case 'browser' : return window;
                        case 'node' : return global;
                    }
                })()
            }).global;
        }
        static get platform(){
            return Object.defineProperty(this,'platform',<any>{
                value:(():string=>{
                    if(typeof window!='undefined'){
                        return 'browser';
                    } else
                    if(typeof process=='object'){
                        return 'node';
                    }
                })()
            }).platform;
        }
        public get modules(): Modules {
            return Object.defineProperty(this,'modules',<any>{
                value : new Modules()
            }).modules;
        }

        public import(uri:string):Promise<any>{
            return this.module(uri,true).then(m=>(
                this.main?this.main:m, m.exports
            ));
        }
        public module(name:string,main=false):Promise<Module>{
            var module = this.modules.get({
                name  : name,
                root  : this.root,
                main  : main
            });
            return Promise.resolve(module)
                .then(this.load)
                .then(this.eval)
                .then(this.define)
                .then(m=>(module.state = ModuleState.DONE,module))
                .catch(e=>(module.state = ModuleState.FAILED,Promise.reject(e)))
            ;
        }
        public register(requires:string[],executor:Function):void{
            this.current.dependencies = requires;
            this.current.executor = executor;
        }
        public bundle(content){
            for(var name in content){
                this.modules.get({
                    name   : this.root+'/'+name+'.js',
                    root   : this.root,
                    main   : false,
                    source : content[name]
                })
            }
        }
        protected runtime:string;
        protected current:Module;
        protected main:Module;

        protected get root(){
            return Object.defineProperty(this,'root',<any>{
                value: Path.resolve(Path.dirname(this.runtime),'..')
            }).root
        }
        protected eval(module:Module):Promise<Module>{
            return Promise.resolve(module);
        }
        protected load(module:Module):Promise<Module>{
            return Promise.resolve(module);
        }
        protected define(module:Module):Promise<Module>{
            if(module.isDefined){
                return Promise.resolve(module);
            }else{
                var dir = Path.dirname(module.url);
                module.state = ModuleState.DEFINING;
                module.dependencies = module.dependencies.map(d=>{
                    var path = d+'.js';
                    if(path[0]=='.'){
                        path = Path.resolve(dir,path)
                    }else{
                        path = Path.resolve(this.root,path);
                    }
                    return Path.moduleId(this.root,path);
                });

                var definer:ModuleDefiner = module.define();
                if(module.dependencies.length){
                    var requires:Promise<Module>[] = module.dependencies.map((r:string):Promise<Module>=>this.module(r));
                    return Promise.all(requires).then(r=>{
                        r.forEach((m,i)=>{
                            if(m.dependants.indexOf(module.name)<0){
                                m.dependants.push(module.name);
                            }
                            definer.inject(i,m.exports);
                        });
                        definer.execute();
                        return Promise.resolve(module)
                    });
                }else{
                    definer.execute();
                    return Promise.resolve(module);
                }
            }
        }
    }

    export class NodeLoader extends Loader {
        private static get fs():any{
            return Object.defineProperty(this,'fs',<any>{
                value:require('fs')
            }).fs;
        }
        private static get vm():any{
            return Object.defineProperty(this,'vm',<any>{
                value:require('vm')
            }).vm;
        }
        protected get context():any{
            return {
                System      : global['System'],
                Reflect     : global['Reflect'],
                Buffer      : global['Buffer'],
                require     : global['require'],
                process     : global['process'],
                console     : global['console'],
                __filename  : this.current.url,
                __dirname   : Path.dirname(this.current.url)
            };
        }
        protected get runtime():string {
            return __filename;
        }

        protected eval(module:Module):Promise<Module>{
            if(module.isEvaluated){
                return Promise.resolve(module);
            }else{
                return new Promise((accept, reject)=> {
                    module.state = ModuleState.EVALUATING;
                    this.current = module;
                    NodeLoader.vm.runInNewContext(module.source,this.context,{
                        filename : module.url
                    });
                    if(this.current.isEvaluated){
                        this.current = null;
                        accept(module)
                    }else{
                        reject(new Error(`Evaluation failed in ${module.url}`))
                    }
                });
            }
        }
        protected load(module:Module):Promise<Module>{
            if(module.isLoaded){
                return Promise.resolve(module);
            }else{
                module.state = ModuleState.LOADING;
                return new Promise((accept, reject)=> {
                    NodeLoader.fs.readFile(module.url, 'utf8',(err, data)=>{
                        if(err){
                            module.source = String(err.stack||err);
                            reject(err)
                        } else {
                            module.source = data;
                            accept(module)
                        }
                    });
                });
            }
        }
    }
    export class BrowserLoader extends Loader{
        get script():any {
            return Object.defineProperty(this,'script',<any>{
                value:(()=>{
                    var script = window.document.querySelector('script[main]');
                    if(!script){
                        var scripts = window.document.querySelectorAll('script');
                        for(var i=0;i<scripts.length;i++){
                            if(scripts[i].src.endsWith('runtime/package.js')){
                                return scripts[i];
                            }
                        }
                    }else{
                        return script;
                    }
                })()
            }).script;
        }
        get runtime():string{
            return this.script.src;
        }

        protected eval(module:Module):Promise<Module>{
            if(module.isEvaluated){
                return Promise.resolve(module);
            }else{
                return new Promise((accept, reject)=> {
                    module.state = ModuleState.EVALUATING;
                    this.current = module;
                    var aHead = window.document.querySelector('head');
                    var aScript = window.document.createElement('script');
                    aScript.type = 'text/javascript';
                    aScript.id = module.name;
                    aScript.text = module.source+'\n//# sourceURL='+module.url;
                    aHead.appendChild(aScript);
                    if(this.current.isEvaluated){
                        this.current = null;
                        accept(module)
                    }else{
                        reject(new Error(`Evaluation failed in ${module.url}`))
                    }
                });
            }
        }
        protected load(module:Module):Promise<Module>{
            if(module.isLoaded){
                return Promise.resolve(module);
            }else{
                module.state = ModuleState.LOADING;
                return new Promise((accept, reject)=> {
                    var oReq = new window.XMLHttpRequest();
                    oReq.addEventListener('load', (e:any)=> {
                        module.source = oReq.responseText;
                        accept(module);
                    });
                    oReq.addEventListener("error",(e:any)=> {
                        module.source = String(e.stack||e);
                        reject(e)
                    });
                    oReq.open("get", module.url, true);
                    oReq.send();
                })
            }
        }
    }

}