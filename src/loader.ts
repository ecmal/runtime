///<reference path="./reflect.ts"/>
namespace Runtime {

    import Module = Reflect.Module;
    import ModuleState = Reflect.ModuleState;

    declare var __filename: any;
    declare var __dirname: any;
    declare var require: any;
    declare var global: any;
    declare var process: any;
    declare var window: any;

    export class Loader {

        constructor(){
            this.load = this.load.bind(this);
            this.define = this.define.bind(this);
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

        public import(uri:string):Promise<any>{
            return this.module(uri).then(m=>(
                this.main=this.main?this.main:(m.main=true,m), m.exports
            ));
        }
        public module(id:string):Promise<Module>{
            var name    = Path.moduleId(this.root, id);
            var url     = Path.moduleUrl(this.root, id);
            var module  = Module.get(name);
            if(!module){
                module = new Module({name,url});
            }
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
            for(var id in content){
                var name    = Path.moduleId(this.root, id);
                var url     = Path.moduleUrl(this.root, id);
                new Module({
                    name   : name,
                    url    : url,
                    main   : false,
                    source : content[name]
                });
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

                module.define();
                if(module.dependencies.length){
                    var requires:Promise<Module>[] = module.dependencies.map(
                        (r:string,i:number):Promise<Module>=>this.module(r).then((m:Module)=>module.inject(m,i))
                    );
                    return Promise.all(requires).then(r=>Promise.resolve(module.execute()));
                }else{
                    return Promise.resolve(module.execute());
                }
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

            return Object.defineProperty(this,'context',<any>{
                value:(()=>{
                    //console.info(Object.keys(global));
                    var context:any = {};
                    for(var name in global){
                        context[name] = global[name];
                    }
                    context.require = require;
                    context.System  = System;
                    context.Reflect = Reflect;
                    context.Runtime = Runtime;
                    context.__filename = this.current.url;
                    context.__dirname = Path.dirname(this.current.url);
                    return context;
                })()
            }).context;

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

                //console.info(module.project,module.path);


                module.state = ModuleState.LOADING;
                return new Promise((accept, reject)=> {
                    if(module.project=='node'){
                        module.source = `System.register([], function(exports) {
                            var exported = require('${module.path}');
                            for(var name in exported){
                                exports(name,exported[name])
                            }
                            exports('default',exported)
                        })`;
                        accept(module)
                    }else {
                        NodeLoader.fs.readFile(module.url, 'utf8', (err, data)=> {
                            if (err) {
                                module.source = String(err.stack || err);
                                reject(err)
                            } else {
                                module.source = data;
                                accept(module)
                            }
                        });
                    }
                });
            }
        }
    }
}
