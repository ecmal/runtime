interface Module {
}
interface System {
}
declare var module: Module;
declare var system: System;
declare module "runtime/events" {
    export class Emitter {
        on(event: string, handler: Function, options?: any): void;
        once(event: string, handler: Function, options?: any): void;
        off(event?: string, handler?: Function): void;
        emit(event: string, ...args: any[]): any[];
    }
}
declare module "runtime/reflect/declaration" {
    import { Emitter } from "runtime/events";
    export class Declaration extends Emitter {
        name: string;
        metadata: any;
        constructor(name: string);
    }
}
declare module "runtime/module" {
    import { Declaration } from "runtime/reflect/declaration";
    global  {
        interface Module extends Declaration {
            name: string;
            url: string;
            requires: string[];
            members: any;
            exports: any;
            parent: Module;
        }
    }
    export interface ModuleMap {
        [name: string]: Module;
    }
    export class Module extends Declaration implements Module {
        name: string;
        url: string;
        requires: string[];
        members: any;
        exports: any;
        parent: Module;
        toString(): string;
        private inspect();
    }
}
declare module "runtime/reflect/interface" {
    import { Declaration } from "runtime/reflect/declaration";
    import { Class } from "runtime/reflect/class";
    import { Module } from "runtime/module";
    export class Interface extends Declaration {
        id: string;
        module: Module;
        implementations: Class[];
        constructor(module: Module, name: string);
    }
}
declare module "runtime/reflect/type" {
    import { Interface } from "runtime/reflect/interface";
    import { Class } from "runtime/reflect/class";
    export class Type {
        static get(reference: Function | Interface | Type, ...params: any[]): Type;
        interface: Interface;
        parameters: Type[];
        isParametrized: boolean;
        isClass: boolean;
        class: Class;
        parent: Type;
        constructor(value: Function | Interface | Type, params: Type[]);
        is(type: Interface): boolean;
        isExtend(type: Class): boolean;
        isImplement(type: Interface): boolean;
    }
}
declare module "runtime/reflect/modifier" {
    export class Modifier {
        static NONE: number;
        static STATIC: number;
        static PUBLIC: number;
        static PROTECTED: number;
        static PRIVATE: number;
        static DECORATED: number;
        static ABSTRACT: number;
        static EXPORT: number;
        static DEFAULT: number;
        static has(a: number, b: number): boolean;
    }
}
declare module "runtime/reflect/method" {
    import { Member } from "runtime/reflect/member";
    import { Type } from "runtime/reflect/type";
    import { Parameter } from "runtime/reflect/parameter";
    export class Method extends Member {
        returns: Type;
        parameters: Parameter[];
        value: Function;
        invoke(target: any, ...args: any[]): any;
    }
}
declare module "runtime/reflect/parameter" {
    import { Declaration } from "runtime/reflect/declaration";
    import { Type } from "runtime/reflect/type";
    import { Decorator } from "runtime/decorators";
    import { Method } from "runtime/reflect/method";
    export class Parameter extends Declaration {
        id: string;
        owner: Method;
        index: number;
        type: Type;
        flags: number;
        decorators: Decorator[];
        constructor(owner: Method, name: string, index: number, flags: number, type: Type);
        toString(): string;
        private inspect();
    }
}
declare module "runtime/reflect/property" {
    import { Member } from "runtime/reflect/member";
    export class Property extends Member {
        setter: Function;
        getter: Function;
        get(target: any): any;
        set(target: any, value: any): this;
    }
}
declare module "runtime/reflect/constructor" {
    import { Method } from "runtime/reflect/method";
    export class Constructor extends Method {
        new(...args: any[]): any;
    }
}
declare module "runtime/reflect/class" {
    import { Decorator } from "runtime/decorators";
    import { Member } from "runtime/reflect/member";
    import { Interface } from "runtime/reflect/interface";
    import { Type } from "runtime/reflect/type";
    import { Constructor } from "runtime/reflect/constructor";
    import { Module } from "runtime/module";
    global  {
        interface Function {
            class: Class;
        }
    }
    export interface ClassMap {
        [name: string]: Module;
    }
    export class Class extends Interface {
        static extend(d: Function, b: Function): void;
        static isClass(target: Function): boolean;
        id: string;
        module: Module;
        original: Function;
        value: Function;
        members: {
            [name: string]: Member;
        };
        decorators: Decorator[];
        interfaces: Type[];
        inheritance: Type;
        type: Type;
        parent: Class;
        parents: Class[];
        flags: number;
        isExported: boolean;
        isDefault: boolean;
        isDecorated: boolean;
        isAbstract: boolean;
        constructor(value: Function);
        getMembers(filter?: (m: Member) => boolean): Member[];
        getAllMembers(filter?: (m: Member) => boolean): Member[];
        getConstructor(): Constructor;
        getMember(name: any, flags?: number, descriptor?: PropertyDescriptor | boolean): Member;
        toString(): string;
        private inspect();
    }
}
declare module "runtime/reflect/member" {
    import { Declaration } from "runtime/reflect/declaration";
    import { Class } from "runtime/reflect/class";
    import { Decorator } from "runtime/decorators";
    import { Type } from "runtime/reflect/type";
    export class Member extends Declaration {
        id: string;
        flags: number;
        owner: Class;
        decorators: Decorator[];
        original: PropertyDescriptor;
        type: Type;
        descriptor: PropertyDescriptor;
        key: string;
        isStatic: boolean;
        isPublic: boolean;
        isProtected: boolean;
        isPrivate: boolean;
        isAbstract: boolean;
        isDecorated: boolean;
        scope: any;
        constructor(owner: Class, name: string, flags: number, descriptor?: PropertyDescriptor);
        decorate(decorators: Decorator[]): void;
        toString(): string;
        private inspect();
    }
}
declare module "runtime/decorators" {
    import { Member } from "runtime/reflect/member";
    import { Method } from "runtime/reflect/method";
    export class Decorator {
        decorate(target: Member): void;
    }
    export class Bound extends Decorator {
        decorate(target: Method): any;
    }
    export class Cached extends Decorator {
        static INSTANCES: symbol;
        static get(type: any, name?: any): any;
        named: string;
        constructor(name?: string);
        decorate(target: Member): any;
    }
}
declare module "runtime/globals" {
    var globals: any;
    export default globals;
}
declare module "runtime/helpers" {
    export class Path {
        static SEP: string;
        static filename(path: String): string;
        static dirname(path: any): any;
        static normalize(path: any): string;
        static resolve(...paths: any[]): any;
        static moduleUrl(base: any, id: any): any;
        static moduleId(base: any, url: any): any;
    }
}
declare module "runtime/loaders/base" {
    import { Module } from "runtime/module";
    export abstract class Loader {
        protected abstract detectRoot(): void;
        protected abstract loadModule(id: string, url: string): Promise<any>;
        private registrations;
        constructor();
        import(name: string, parent?: Module): Promise<any>;
        register(name: string, requires: string[], definer: Function): any;
    }
}
declare module "runtime/loaders/node" {
    import { Loader } from "runtime/loaders/base";
    export class NodeLoader extends Loader {
        constructor();
        private static fs;
        private static vm;
        protected runtime: string;
        protected detectRoot(): void;
        protected loadModule(id: string, url: string): Promise<any>;
        protected nodeModule(id: any): string;
        protected evalModule(id: string, url: string, data: string): void;
    }
}
declare module "runtime/loaders/browser" {
    import { Loader } from "runtime/loaders/base";
    export class BrowserLoader extends Loader {
        script: any;
        runtime: string;
        protected detectRoot(): void;
        protected loadModule(id: string, url: string): Promise<any>;
    }
}
declare module "runtime/loader" {
    export * from "runtime/loaders/base";
    export * from "runtime/loaders/node";
    export * from "runtime/loaders/browser";
}
declare module "runtime/system" {
    import { Emitter } from "runtime/events";
    import { Module, ModuleMap } from "runtime/module";
    import { Class, ClassMap } from "runtime/reflect/class";
    import "runtime/globals";
    export interface Globals {
        [k: string]: any;
    }
    export interface NodeGlobals {
        process: any;
        module: any;
        dirname: string;
        filename: string;
        require(module: string): any;
    }
    export interface BrowserGlobals {
        [k: string]: any;
    }
    global  {
        interface System extends Emitter {
            url: string;
            root: string;
            platform: "browser" | "node";
            module: Module;
            modules: {
                [k: string]: Module;
            };
            classes: {
                [k: string]: Class;
            };
            globals: any;
            node: NodeGlobals;
            browser: BrowserGlobals;
        }
    }
    export class System extends Emitter implements System {
        url: string;
        root: string;
        module: Module;
        modules: ModuleMap;
        classes: ClassMap;
        import(name: string): Promise<any>;
        register(name: string, requires: string[], definer: Function): any;
        globals: any;
        platform: string;
    }
    export default system;
}
