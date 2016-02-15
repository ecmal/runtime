class System {
    constructor(){
        if(!Runtime.Loader.global.System){
            Runtime.Loader.global.System = System;
        }
        return System;
    }
    static get platform():string{
        return Runtime.Loader.platform;
    }
    static get loader() : Runtime.Loader {
        return Object.defineProperty(this,'loader',<any>{
            value:(():Runtime.Loader=>{
                switch(System.platform){
                    case 'browser'  : return new Runtime.BrowserLoader();
                    case 'node'     : return new Runtime.NodeLoader();
                }
            })()
        }).loader;
    }
    static get modules(): Runtime.Modules {
        return this.loader.modules;
    }
    static module(uri:string):Promise<Runtime.Module>{
        return this.loader.module(uri);
    }
    static import(uri:string):Promise<any>{
        return this.loader.import(uri);
    }
    static register(requires:string[],execute:Function):void{
        this.loader.register(requires,execute);
    }
    static bundle(content){
        this.loader.bundle(content);
    }
}


new System();