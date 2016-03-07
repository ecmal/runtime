///<reference path="package.ts"/>

import {Module} from "./reflect/module"
import {Emitter} from "./utils/events"
import {Path} from "./utils/path"
import {Class} from "./reflect/class";
import {Definition} from "./reflect/definition";



declare var window;
declare var process;
declare var global;
declare var __filename;
declare var require;

var system:System;
var locker:symbol;

export class System extends Emitter {
    constructor(modules){
        if(!system){
            super();
            system = this;
            locker = Definition[Symbol.for('lock')]();
            delete Definition[Symbol.for('lock')];
            if(typeof global!="undefined"){
                global.System = system;
            }
            SModule.setup(modules)
        }else{
            throw new Error("System can't be instantiated")
        }
    }
    get smodules(){
        return SModule.map;
    }
    get modules(){
        return Module.map;
    }
    private register(id,requires,definer){
        SModule.get(id).register(requires,definer);
    }
    public import(id:string):Promise<any>{
        return SModule.get(id).initialize().then(m=>{
            return m.exports;
        });
    }
}

class SField {

}
class SMethod {

}
class SMember {

}
class SClass {}
class SModule extends Emitter {

    static DONE:string = 'done';
    static map:any=Object.create(null);

    static setup(modules){
        Object.keys(modules).forEach(id=>{
            var requires = modules[id].requires;
            var exports = modules[id].exports;
            var module = SModule.get(id);
            requires.forEach((id)=>{
                module.require(id)
            });
            Object.keys(exports).forEach((key)=>{
                var value:any = exports[key];
                if(value.$class){
                    delete value.$class;
                    module.defineClass(value);
                }
                module.export(key,value);
            });
            module.url = SystemLoader.loader.runtime;
            module.isDone = true;
        });
        SModule.map=Object.create(null);
    }
    static get(data):SModule {
        return new SModule(data);
    }

    module:any;
    isDone:boolean;
    isLoading:boolean;
    isExecuting:boolean;
    executor:any;
    exports:any;
    classes:any;

    get url():string{
        return this.module.url;
    }
    set url(v:string){
        this.module.url = v;
    }
    get id(){
        return this.module.id;
    }
    get exports(){
        if(!this.module.exports){
            this.module.exports = Object.create(null);
        }
        return this.module.exports;
    }
    get classes(){
        if(!this.module.classes){
            this.module.classes = Object.create(null);
        }
        return this.module.classes;
    }
    get dependencies(){
        if(!this.module.dependencies){
            this.module.dependencies = [];
        }
        return this.module.dependencies;
    }
    public get dependants(){
        if(!this.module.dependants){
            this.module.dependants = [];
        }
        return this.module.dependants;
    }

    constructor(data){
        super();
        var id = String(data.id||data);
        if(SModule.map[id]){
            return SModule.map[id];
        }else{
            this.module = new Module(locker,id);
            SModule.map[id] = this;
        }
    }
    defineClass(target){
        if(typeof target == 'object'){
            target = target.constructor;
        }
        if(!this.classes[target.name]){
            this.classes[target.name] = new Class(locker,this.id+'#'+target.name);
        }
        console.info("class",this.id,target.name);
    }
    extends(child, parent) {
        //Class.define(this.module,child);
        if(!parent){ return }
        for (var p in parent) {
            if (parent.hasOwnProperty(p)) {
                Object.defineProperty(child,p,Object.getOwnPropertyDescriptor(parent,p));
            }
        }
        function Prototype() {
            this.constructor = child;
        }
        child.prototype = parent === null ? Object.create(parent) : (
            Prototype.prototype = parent.prototype, new Prototype()
        );
    }
    decorate(decorators,target,key,desc){
        if(key){
            //var m = Member.define(target,key);
            //console.info(m);
        }else{
            //var c = Class.define(this.module,target);
            //console.info(c);
            return target;
        }

    }
    metadata(...args){
        //console.info("Meta",...args)
    }
    metadataType(cb){
        /*return (target,key)=>{
            Object.defineProperty(Member.define(target,key),'type',{
                configurable:true,
                get(){
                    return Object.defineProperty(this,key,{
                        enumerable:true,
                        value:cb()
                    })[key]
                }
            });
        }*/
    }
    metadataReturnType(...args){
        //console.info("ReturnType",...args)
    }
    metadataParams(...args){
        //console.info("Params",...args)
        /*return (target,key,desc)=>{

        }*/
    }
    param(...args){
        //console.info("Param",...args)
    }
    type(...args){
        //console.info("Type",...args)
    }

    initialize():Promise<SModule>{
        if(this.isDone){
            return Promise.resolve(this);
        } else {
            this.load().then(r=>{
                this.execute();
                this.emit(SModule.DONE);
            });
            return new Promise((accept,reject)=>{
                this.on(SModule.DONE,(error)=>{
                    error?reject(error):accept(this)
                });
            })
        }
    }
    load():Promise<SModule>{
        if(!this.isDone && !this.isLoading){
            this.isLoading = true;
            return SystemLoader.loader.load(this);
        }else{
            return Promise.resolve(this);
        }
    }
    execute(){
        if(!this.isExecuting && this.executor){
            this.isExecuting = true;
            this.dependencies.map((d,i)=>{
                var exports = SModule.get(d.id).execute();
                var setter = this.executor.setters[i];
                if(setter){
                    setter(exports);
                }
            });
            this.executor.execute();
            delete this.executor;
            this.isDone = true;
            this.isExecuting = false;
        }
        return this.exports;
    }

    register(requires,executor){
        var bindings={};
        for(var binding of [
            'extends','decorate','param','type',
            'metadata','metadataType','metadataReturnType','metadataParams'
        ]){
            bindings[`__${binding}`] = (args)=>{
                this[binding](...args)
            };
        }
        this.executor = executor((key,value)=>this.export(key,value),bindings);
        requires.forEach((id)=>this.require(id));
        this.emit('register');
    }
    require(id){
        var dependency:SModule = SModule.get(id);
        var dependant:SModule = this;
        if(dependant.dependencies.indexOf(dependency.module)<0){
            dependant.dependencies.push(dependency.module);
        }
        if(dependency.dependants.indexOf(dependant.module)<0){
            dependency.dependants.push(dependant.module);
        }
    }
    export(key,value){
        if(typeof key=='object'){
            for(var k in key){
                this.exports[k]=key[k];
            }
        }else{
            this.exports[key]=value;
        }
    }
}
class SystemLoader {
    static get platform():string{
        return Object.defineProperty(this,'platform',{
            value:(()=>{
                if(typeof window!='undefined'){
                    return 'browser'
                } else
                if(typeof process=='object'){
                    return 'node'
                }
            })()
        }).platform;
    }
    static get loader():SystemLoader{
        return Object.defineProperty(this,'loader',{
            value:(():SystemLoader=>{
                switch(this.platform){
                    case 'browser': return new BrowserLoader();
                    case 'node': return new NodeLoader();
                }
            })()
        }).loader;
    }

    public runtime:string;
    public get root(){
        return Object.defineProperty(this,'root',<any>{
            value: Path.resolve(Path.dirname(this.runtime),'..')
        }).root
    }

    load(module:SModule):Promise<any>{
       return null;
    }
}
class NodeLoader extends SystemLoader {
    get runtime():string{
        return __filename;
    }
    context(module):any{
        var context:any = {};
        for(var name in global){
            context[name] = global[name];
        }
        context.require = require;
        context.System  = system;
        context.__filename = module.url;
        context.__dirname = Path.dirname(module.url);
        return context;
    }
    load(module:SModule){
        if(!module.url){
            module.url = Path.normalize(this.root+'/'+module.id+'.js');
        }
        return new Promise((accept, reject)=> {
            try {
                var source;
                if (module.id.indexOf('node/') == 0) {
                    var mid = module.id.replace('node/', '');
                    source = `System.register("${module.id}",[],function(exports) {
                        var exported = require('${mid}');
                        for(var name in exported){
                            exports(name,exported[name])
                        }
                        exports('default',exported)
                    })`;
                } else {
                    source = require('fs').readFileSync(module.url, 'utf8');
                }
                require('vm').runInNewContext(source, this.context(module), {
                    filename: module.url
                });
                accept(module);
            }catch(ex){
                reject(ex);
            }
        }).then((e)=> {
            return Promise.all(module.dependencies.map(d=>{
                return SModule.get(d.id).load();
            })).then(r=>module)
        });
    }
}
class BrowserLoader extends SystemLoader {
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
    load(module:SModule){
        if(!module.url){
            module.url = Path.normalize(this.root+'/'+module.id+'.js');
        }
        var script = window.document.querySelector(`script[src="${module.url}"]`);
        if(!script){
            script = window.document.createElement('script');
            script.setAttribute('src',module.url);
            var head = window.document.querySelector(`head`);
            head.appendChild(script);
            return new Promise((accept,reject)=>{
                script.onload = (e)=>{accept(e)};
                script.onerror = (e)=>{reject(e)};
            }).then((e)=> {
                return Promise.all(module.dependencies.map(d=>{
                    return SModule.get(d.id).load();
                })).then(r=>module)
            });
        }else{
            return Promise.resolve(module);
        }
    }
}

//export default system;