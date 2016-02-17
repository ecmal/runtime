
namespace Runtime {
    import ModuleState = Reflect.ModuleState;
    import Class = Reflect.Class;
    import Definition = Reflect.Definition;
    import Scope = Reflect.Scope;
    import METADATA = Reflect.METADATA;
    import Member = Reflect.Member;
    import Method = Reflect.Method;
    import Accessor = Reflect.Accessor;
    import Field = Reflect.Field;
    import Param = Reflect.Param;

    declare var __filename: any;
    declare var __dirname: any;
    declare var require: any;
    declare var global: any;
    declare var process: any;
    declare var window: any;

    export class ModuleDecorator {
        public module:Module;
        constructor(module){
            this.module = module;
            this.__metadata = this.__metadata.bind(this);
            this.__decorate = this.__decorate.bind(this);
            this.__extends = this.__extends.bind(this);
            this.__param = this.__param.bind(this);
        }
        __decorate(decorators, target, key, desc) {
            var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
            for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            if(c > 3 && r ){
                Object.defineProperty(target, key, r)
            }
            this.__define(target,key);
            return r;
        }
        __metadata(k, v) {
            return (target,key,desc)=>{
                var def = this.__define(target,key);
                switch(k){
                    case 'design:returntype'    :
                        (<Method>def).returnType = v;
                        break;
                    case 'design:paramtypes'    :
                        try {
                            let paramTypes:Function[] = v;
                            let closureStr = String((desc && desc.value) || target).match(/function\s*[a-z0-9$_,\s]*\(([a-z0-9$_,\s]*)\)/i);
                            if (closureStr) {
                                closureStr = closureStr[1].trim().split(/\s+\,\s+/)
                            }
                            let paramNames= closureStr;
                            let params:Param[]=[];
                            for(var i=0;i<paramTypes.length;i++){
                                params[i] = new Param(paramNames[i],def,paramTypes[i]);
                            }
                            (<Method|Class> def).params = params;
                        }catch(e){
                            console.info(e)
                        }
                        break;
                    case 'design:type' :
                        (<Member>def).type = v;
                        break;
                }
            }
        }
        __param(paramIndex, decorator){
            return (target, key)=>{
                decorator(target, key, paramIndex);
            }
        }
        __extends(d, b) {
            var dd:Class = <Class>this.__define(d);
            var bb:Class = <Class>this.__define(b);
            dd.parent = bb;
            if(!bb.children){
                bb.children = [dd];
            }else{
                bb.children.push(dd);
            }
            for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        }
        __define(target, key?, desc?):Definition {
            var scope:Scope,closure:Function;
            switch(typeof target){
                case "function" :
                    closure = target;
                    scope = Scope.STATIC;
                    break;
                case "object"   :
                    closure = target.constructor;
                    scope = Scope.INSTANCE;
                    break;
            }
            var cls:Class = closure[METADATA];
            if(!cls){
                cls = closure[METADATA]
                    = this.module.classes[closure.name]
                    = new Class(<Reflect.Module>this.module,closure);
            }
            if(key){
                var member:Member = cls.get(scope,key);
                if(!member){
                    var descriptor = desc || Object.getOwnPropertyDescriptor(target, key) || {
                            enumerable: true,
                            configurable: true,
                            writable: true,
                            value: null
                        };
                    if (typeof descriptor.value == 'function') {
                        member = new Method(key, cls, scope);
                    } else
                    if (descriptor.get || descriptor.set) {
                        member = new Accessor(key, cls, scope);
                    } else {
                        member = new Field(key, cls, scope);
                    }
                    cls.add(member);
                    //console.info(member);
                }
                return member;
            }else{
                return cls;
            }
        }
    }
    export class Module extends Reflect.Module {
        private definer:any;
        private executor: Function;
        private error: any;
        public get isDefined():boolean{
            return !!this.exports;
        }
        public get isEvaluated():boolean{
            return this.isDefined || !!this.executor;
        }
        public get isLoaded():boolean{
            return this.isEvaluated || !!this.source;
        }
        public get isExecuted():boolean{
            return this.isDefined && (!this.definer || !this.definer.execute)
        }
        public define() {
            if(this.executor) {
                this.exports = Object.create(null);
                var decorator = new ModuleDecorator(this);
                var executor = this.executor.bind(decorator);
                delete this.executor;
                this.definer = executor((key, value)=> {
                    this.exports[key] = value;
                });
            }
        }
        public register(requires:string[],executor:Function){
            this.executor = executor;
            this.dependencies = requires.map(d=>{
                var path = d;
                if(path[0]=='.'){
                    path = Path.resolve(Path.dirname(this.name),path);
                }
                return path;
            });
        }
        public inject(module:Module,index:number):Module{
            if(module.dependants.indexOf(this.name)<0){
                module.dependants.push(this.name);
            }
            this.definer.setters[index](module.exports);
            this.definer.setters[index] = true;
            return module;
        }
        public execute(clean:boolean=true){
            if(this.definer && this.definer.execute){
                this.definer.execute();
            }
            delete this.definer;
            return this;
        }
        public done(error?:any):Module{
            if(!error){
                this.state = ModuleState.DONE;
                return this;
            }else{
                this.state = ModuleState.FAILED;
                this.error = error;
                throw error;
            }
        }
    }
    export class Loader {

        constructor(){
            this.load = this.load.bind(this);
            this.define = this.define.bind(this);
            this.eval = this.eval.bind(this)
            this.execute = this.execute.bind(this)
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
            var module = this.get(id);
            var promise = Promise.resolve(module);
            promise = promise.then(this.load);
            promise = promise.then(this.eval);
            promise = promise.then(this.define);
            promise = promise.then(this.execute);
            return promise.then(m=>(module.done()),e=>(module.done(e)));
        }
        public register(requires:string[],executor:Function):void{
            this.current.register(requires,executor)
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
        protected get(id):Module{
            var name    = Path.moduleId(this.root, id);
            var url     = Path.moduleUrl(this.root, id);
            var module  = <Module>Module.get(name);
            if(!module){
                module = new Module({name,url});
            }
            return module;
        }
        protected eval(module:Module):Promise<Module>{
            return Promise.resolve(module);
        }
        protected load(module:Module):Promise<Module>{
            return Promise.resolve(module);
        }
        protected execute(module:Module):Module {
            if (module.state != ModuleState.EXECUTING){
                module.state = ModuleState.EXECUTING;
                module.dependencies.forEach(d=> {
                    this.execute(this.get(d))
                });
                module.execute();
            }
            return module;
        }
        protected define(module:Module):Promise<Module>{
            if(module.isDefined){
                return Promise.resolve(module);
            }else{
                module.state = ModuleState.DEFINING;
                module.define();
                if(module.dependencies.length){
                    var requires:Promise<Module>[] = module.dependencies.map(
                        (r:string,i:number):Promise<Module>=>{
                            var promise = Promise.resolve(this.get(r));
                            promise = promise.then(this.load);
                            promise = promise.then(this.eval);
                            promise = promise.then(this.define);
                            return promise.then((m:Module)=>{
                                return module.inject(m,i)
                            })
                        }
                    );
                    return Promise.all(requires).then(r=>{
                        return Promise.resolve(module)
                    });
                }else{
                    return Promise.resolve(module);
                }
            }
        }
    }
}