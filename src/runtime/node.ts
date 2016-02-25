///<reference path="./loader.ts"/>
namespace Runtime {
    import ModuleState = Reflect.ModuleState;

    declare var __filename: any;
    declare var __dirname: any;
    declare var require: any;
    declare var global: any;
    declare var process: any;
    declare var window: any;

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
                var promise = module['loader'];
                if(!promise) {
                    module.state = ModuleState.LOADING;
                    promise = module['loader'] = new Promise((accept, reject)=> {
                        if (module.project == 'node') {
                            module.source = `System.register([], function(exports) {
                                var exported = require('${module.path}');
                                for(var name in exported){
                                    exports(name,exported[name])
                                }
                                exports('default',exported)
                            })`;
                            accept(module)
                        } else {
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
                return promise;
            }
        }
    }
}