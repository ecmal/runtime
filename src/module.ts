namespace Runtime {

    const metadata:symbol = Symbol('metadata');

    export enum Scope {
        STATIC, INSTANCE
    }
    export enum ModuleState {
        CREATED,
        LOADING,
        EVALUATING,
        DEFINING,
        DONE,
        FAILED
    }

    export class Definition {
        static for(target:any,key?:string,index?:number):Definition {
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
            var cls:Class = closure[metadata];
            if(cls && key){
                var member = cls.get(scope,key);
                if(member && typeof index=="number" && (member instanceof Method)){
                    return member.params[index];
                }else{
                    return member;
                }
            }else{
                return cls;
            }
        }
        public name:string;
        public metadata:any;
        constructor(name:string){
            this.name = name;
            this.metadata = Object.create(null);
        }

        getMetadata(key){
            return this.metadata[Symbol.for(key)];
        }
        hasMetadata(key):boolean{
            return !!this.getMetadata(key)
        }
        getMetadataKeys(){
            return Object.getOwnPropertySymbols(this.metadata).map(k=>Symbol.keyFor(k));
        }
        setMetadata(key:any,value:any){
            this.metadata[Symbol.for(key)] = value;
        }
        deleteMetadata(key:any){
            delete this.metadata[Symbol.for(key)];
        }
        toJSON(...any):any{
            return {
                name: this.name,
                parent: this.constructor.name
            }
        }
    }
    export class Class extends Definition {
        public owner:Module;
        public params:Param[];
        public parent:Class;
        public children:Class[];
        public static:{[name:string]:Member};
        public instance:{[name:string]:Member};
        constructor(module:Module,constructor:Function){
            super(constructor.name);
            this.owner = module;
            this.static = {};
            this.instance = {};
            this.constructor = constructor;
            this.owner.add(this)
        }
        get(scope:Scope,name:string){
            switch(scope){
                case Scope.STATIC   :
                    if(this.static[name]){
                        return this.static[name]
                    }
                break;
                case Scope.INSTANCE :
                    if(this.instance[name]){
                        return this.instance[name]
                    }
                break;
            }
        }
        add(member:Member){
            switch(member.scope){
                case Scope.STATIC   : this.static[member.name] = member; break;
                case Scope.INSTANCE : this.instance[member.name] = member; break;
            }
        }
        toJSON(...any):any{
            return {
                name            : this.name,
                parent          : this.parent?this.parent.name:undefined,
                children        : (()=>{
                    return this.children
                        ? this.children.map(c=>c.name)
                        : undefined
                })(),
                params          : (()=>{
                    if(this.params && this.params.length) {
                        var map = Object.create(null), count = 0;
                        Object.keys(this.params).forEach((m:string)=> {
                            map[m] = this.params[m].toJSON();count++;
                        });
                        return count > 0 ? map : undefined;
                    }
                })(),
                members         : (()=>{
                    var map = Object.create(null),count=0;
                    Object.keys(this.static).forEach((m:string)=>{
                        map[`.${m}`] = this.static[m].toJSON();count++;
                    });
                    Object.keys(this.instance).forEach((m:string)=>{
                        map[`#${m}`] = this.instance[m].toJSON();count++;
                    });
                    return count>0?map:undefined;
                })()
            };
        }
    }
    export class Member extends Definition {
        public owner:Class;
        public scope:Scope;
        public name:string;
        public type:Function;
        constructor(name:string,owner:Class,scope:Scope){
            super(name);
            this.owner = owner;
            this.scope = scope;
            this.name = name;
        }
        toJSON(){
            return {
                name            : this.name,
                kind            : this.constructor.name,
                owner           : this.owner.name,
                scope           : this.scope,
                type            : this.type?this.type.name:undefined
            };
        }
    }
    export class Param extends Definition {
        public owner:Definition;
        public type:Function;
        constructor(name:string,owner:Definition,type:Function){
            super(name);
            this.owner = owner;
            this.type = type;
        }
        toJSON(...any):any{
            return {
                name            : this.name,
                owner           : this.owner.name,
                type            : this.type?this.type.name:undefined
            };
        }
    }
    export class Method extends Member {
        public params:Param[];
        public returnType:Function;
        toJSON(...any):any{
            return {
                name            : this.name,
                kind            : this.constructor.name,
                owner           : this.owner.name,
                scope           : this.scope,
                type            : this.type?this.type.name:undefined,
                returnType      : this.returnType?this.returnType.name:undefined,
                params          : (()=>{
                    if(this.params && this.params.length) {
                        var map = Object.create(null), count = 0;
                        Object.keys(this.params).forEach((m:string)=> {
                            map[m] = this.params[m].toJSON();count++;
                        });
                        return count > 0 ? map : undefined;
                    }
                })()

            };
        }
    }
    export class Field extends Member {}
    export class Accessor extends Field {}
    export class Modules {
        get(data?:any):Module{
            if(data) {
                if(typeof data=='string'){
                    data = {name:data}
                }
                var name = Path.moduleId(data.root, (data.url||data.name));
                var module:Module = <Module>this[name];
                if (!module && data.root) {
                    data.name = name;
                    data.url = Path.moduleUrl(data.root, name);
                    module = this[name] = new Module(data);
                }
                return module;
            }else{
                return null;
            }
        }
        toJSON(...any):any{
            var modules:any = Object.create(null);
            for(var i in this){
                if(this[i] instanceof Module){
                    modules[i] = this[i].toJSON();
                }
            }
            return modules
        }
    }
    export class Module extends Definition {

        public root:string;
        public main:boolean;
        public url:string;
        public source:string;
        public exports:any;
        public state:ModuleState;
        public dependencies:string[];
        public dependants:string[];
        public classes:{[name:string]:Class};
        public executor:Function;

        public get isDefined():boolean{
            return !!this.exports;
        }
        public get isEvaluated():boolean{
            return this.isDefined || !!this.executor;
        }
        public get isLoaded():boolean{
            return this.isEvaluated || !!this.source;
        }

        constructor(data:any){
            super(data.name);
            this.url = data.url;
            this.main = data.main||false;
            this.root = data.root;
            this.source = data.source;
            this.exports = data.exports;
            this.dependencies = data.dependencies||[];
            this.dependants = data.dependants||[];
            this.classes = {};
        }

        public define():ModuleDefiner {
            if(this.executor) {
                this.exports = {};
                var decorator = new ModuleDecorator(this);
                var executor = this.executor.bind(decorator);
                delete this.executor;
                var definer = executor((key, value)=> {
                    this.exports[key] = value;
                });
                definer.execute = definer.execute.bind(decorator);
                for(var s=0;s<definer.setters.length;s++){
                    definer.setters[s] = definer.setters[s].bind(decorator);
                }
                return new ModuleDefiner(definer.setters,definer.execute);
            }
        }
        public add(cls:any){
            this.classes[cls.name] = cls;
        }
        public setClass(clazz:Class){
            this.classes[clazz.name] = clazz;
        }
        public getClass(name):Class{
            return this.classes[name];
        }
        public toJSON(...any):any{
            return {
                name            : this.name,
                url             : this.url,
                main            : this.main,
                source          : this.source,
                state           : ModuleState[this.state],
                dependencies    : this.dependencies,
                dependants      : this.dependants,
                exports         : (():any=>{
                    if(this.exports){
                        return Object.keys(this.exports)
                    }
                })(),
                classes         : (():any=>{
                    var map = Object.create(null),count=0;
                    Object.keys(this.classes).forEach((c:string)=>{
                        map[c] = this.classes[c].toJSON();count++
                    });
                    return count>0?map:undefined;
                })()
            };
        }
    }
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
            var cls:Class = closure[metadata];
            if(!cls){
                cls = closure[metadata]
                    = this.module.classes[closure.name]
                    = new Class(this.module,closure);
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
    export class ModuleDefiner {
        setters : Function[];
        execute : Function;
        constructor(setters,execute){
            this.setters = setters;
            this.execute = execute;
        }
        inject(i,exports){
            this.setters[i](exports);
        }
    }

}
