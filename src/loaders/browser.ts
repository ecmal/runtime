import {Loader} from "./base";

declare var window:any;

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
    protected detectRoot(){
        Object.defineProperty(system,'url',{
            enumerable:true,
            configurable:false,
            writable:false,
            value:this.runtime
        });
    }
    protected loadModule(id:string,url:string):Promise<any>{
        return new Promise((accept,reject)=>{
            var aHead = window.document.head;
            var aScript = window.document.createElement('script');
            aScript.type = 'text/javascript';
            aScript.id = id;
            aScript.src = url;
            aScript.onload = accept;
            aScript.onerror = reject;
            aHead.appendChild(aScript);
        });
    }
}