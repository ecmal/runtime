import {Loader} from "./base";

declare var window:any;

export class WebLoader extends Loader {
    get script():any {
        return Object.defineProperty(this,'script',<any>{
            value:(()=>{
                var script = window.document.querySelector('script[main]');
                if(!script){
                    var scripts = window.document.querySelectorAll('script');
                    for(var i=0;i<scripts.length;i++){
                        if(scripts[i].src.indexOf('@ecmal/runtime')>0){
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
    public register(name:string,requires:string[],definer:Function):any{
        if(Array.isArray(name)){
            definer = requires as any;
            requires = name as any;
            name = document.currentScript.id;
        }        
        super.register(name,requires,definer);
    }
    protected detectRoot(){
        Object.defineProperty(System,'url',{
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
            aScript.onload = ()=>{
                accept(this.registrations[id])
            };
            aScript.onerror = reject;
            aHead.appendChild(aScript);
        });
    }
    protected loadProject(id:string,url:string):Promise<any>{
        return this.loadJson(url);
    }
    protected loadJson(url:string){
        return this.loadText(url).then(r=>JSON.parse(r));
    }
    protected loadText(url:string):Promise<string>{
        return new Promise((accept,reject)=>{
            var request = new XMLHttpRequest();
            request.onreadystatechange = function() {
                if(request.readyState == 4){
                    if (request.status == 200) {
                        accept(request.responseText);
                    }else{
                        reject(new Error(`${request.status} ${request.statusText}`))
                    }
                }
            };
            request.open("GET", url, true);
            request.send();
        })
    }
}