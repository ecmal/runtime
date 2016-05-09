///<reference path="./helpers.ts"/>
///<reference path="./reflect.ts"/>
///<reference path="./runtime/loader.ts"/>
///<reference path="./runtime/browser.ts"/>
///<reference path="./runtime/node.ts"/>

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
    static get modules(): Reflect.Modules {
        return Reflect.MODULES;
    }
    static module(uri:string):Promise<Reflect.Module>{
        return this.loader.module(uri);
    }
    static import(uri:string):Promise<any>{
        return this.loader.import(uri);
    }
    static register(name:string,requires:string[],execute:Function):void{
        this.loader.register(name,requires,execute);
    }
    static bundle(content){
        this.loader.bundle(content);
    }
}
new System();