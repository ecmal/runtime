namespace Reflect {
    export type Modules = {
        [name:string]:Module
    }
    export const METADATA:symbol = Symbol('metadata');
    export const MODULES:Modules = Object.create(null);


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
            var cls:Class = closure[METADATA];
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

    export class Module extends Definition {
        static all():Module[] {
            return Object.keys(MODULES).map(name=>this.get(name));
        }
        static has(name:string):boolean{
            return !!this.get(name);
        }
        static get(name:string):Module {
            return MODULES[name];
        }

        private definer:any;
        public main:boolean;
        public url:string;
        public source:string;
        public exports:any;
        public state:ModuleState;
        public dependencies:string[];
        public dependants:string[];
        public classes:{[name:string]:Class};
        public executor:Function;

        public get project():string{
            return this.name.split('/')[0];
        }
        public get path():string{
            return this.name.substr(this.project.length+1);
        }
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
            if(!MODULES[this.name]){
                MODULES[this.name] = this;
                this.url = data.url;
                this.main = data.main||false;
                this.source = data.source;
                this.exports = data.exports;
                this.dependencies = data.dependencies||[];
                this.dependants = data.dependants||[];
                this.classes = Object.create(null);
            }else{
                throw new Error(`Duplicate module definition with name '${this.name}'`);
            }
        }

        public define() {
            if(this.executor) {
                this.exports = Object.create(null);
                var decorator = new ModuleDecorator(this);
                var executor = this.executor.bind(decorator);
                delete this.executor;
                var definer:any = this.definer = executor((key, value)=> {
                    this.exports[key] = value;
                });
            }
        }
        public inject(module:Module,index:number):Module{
            module.execute(false);
            if(module.dependants.indexOf(this.name)<0){
                module.dependants.push(this.name);
            }
            this.definer.setters[index](module.exports);
            return module;
        }
        public execute(clean:boolean=true){
            if (this.definer) {
                if(this.definer.execute){
                    this.definer.execute();
                    delete  this.definer.execute;
                }
                if (clean) {
                    delete this.definer;
                }
            }
            return this;
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
    class ModuleDecorator {
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

    export function metadata(metadataKey: any, metadataValue: any):any  {
        return (target:any,targetKey:any):void=>defineMetadata(metadataKey,metadataValue,target,targetKey);
    }
    export function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKey?: string): void {
        Definition.for(target,targetKey).setMetadata(metadataKey,metadataValue);
    }
    export function hasMetadata(metadataKey: any, target: Object, targetKey?: string): boolean {
        var cls:Class = <Class>Definition.for(target);
        while(cls){
            var def = Definition.for(cls.constructor,targetKey);
            if(def && def.hasMetadata(metadataKey)){
                return true;
            }else{
                cls = cls.parent;
            }
        }
        return false
    }
    export function hasOwnMetadata(metadataKey: any, target: Object, targetKey?: string): boolean {
        var def = Definition.for(target,targetKey);
        if(def){
            return def.hasMetadata(metadataKey)
        }else{
            return false;
        }
    }
    export function getMetadata(metadataKey: any, target: Object, targetKey?:string ): any {
        var cls:Class = <Class>Definition.for(target);
        while(cls){
            var def = Definition.for(cls.constructor,targetKey);
            if(def && def.hasMetadata(metadataKey)){
                return def.getMetadata(metadataKey);
            }else{
                cls = cls.parent;
            }
        }
        return null
    }
    export function getOwnMetadata(metadataKey: any, target: Object, targetKey?: string): any {
        var def = Definition.for(target,targetKey);
        if(def && def.hasMetadata(metadataKey)){
            return def.getMetadata(metadataKey);
        }else{
            return null;
        }
    }
    export function getMetadataKeys(target: Object, targetKey?: string): any[] {
        var cls:Class = <Class>Definition.for(target);
        var keys:any[];
        while(cls){
            var def = Definition.for(cls.constructor,targetKey);
            if(def){
                return keys = keys.concat(def.getMetadataKeys());
            }else{
                cls = cls.parent;
            }
        }
        return keys;
    }
    export function getOwnMetadataKeys(target: Object, targetKey?: string): any[] {
        var def = Definition.for(target,targetKey);
        if(def){
            return def.getMetadataKeys()
        }else{
            return []
        }
    }
    export function deleteMetadata(metadataKey: any, target: Object, targetKey?: string): boolean {
        var def = Definition.for(target,targetKey);
        if(def && def.hasMetadata(metadataKey)){
            def.deleteMetadata(metadataKey);
            return true;
        }else{
            return false
        }
    }
}