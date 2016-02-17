///<reference path="./loader.ts"/>
namespace Runtime {
    import ModuleState = Reflect.ModuleState;

    declare var __filename: any;
    declare var __dirname: any;
    declare var require: any;
    declare var global: any;
    declare var process: any;
    declare var window: any;

    export class BrowserLoader extends Loader {
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