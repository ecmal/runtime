interface Module {
}
interface System {
}
declare var module: Module;
declare var system: System;
declare module "runtime/events" {
    export class Emitter {
        on(event: string, handler: Function): (options: any) => void;
        once(event: string, handler: Function): (options: any) => void;
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
declare module "runtime/decorators" {
    import { Declaration } from "runtime/reflect/declaration";
    export class Decorator {
        decorate(target: Declaration): void;
    }
    export class Metadata extends Decorator {
        constructor(name: String, value: any);
        decorate(target: Declaration): void;
    }
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
declare module "runtime/reflect/class" {
    import { Declaration } from "runtime/reflect/declaration";
    import { Decorator } from "runtime/decorators";
    global  {
        interface Function {
            class: Class;
        }
    }
    export interface ClassMap {
        [name: string]: Module;
    }
    export class Interface extends Declaration {
        id: string;
        module: Module;
        implementations: Class[];
        constructor(module: Module, name: string);
    }
    export class Type {
        static get(reference: string | Function | Type, ...params: any[]): Type;
        reference: Class;
        parameters: any[];
        constructor(value: any, params: any);
    }
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
    export class Member extends Declaration {
        id: string;
        flags: number;
        owner: Class;
        decorators: Decorator[];
        original: PropertyDescriptor;
        type: Type;
        descriptor: PropertyDescriptor;
        isStatic: boolean;
        isPublic: boolean;
        scope: any;
        constructor(owner: Class, name: string, flags: number, descriptor?: PropertyDescriptor);
        decorate(decorators: Decorator[]): void;
        toString(): string;
        private inspect();
    }
    export class Property extends Member {
    }
    export class Method extends Member {
    }
    export class Constructor extends Method {
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
        constructor(module: Module, name: string, value: Function);
        getMember(name: any, flags?: number, descriptor?: PropertyDescriptor | boolean): Member;
        toString(): string;
    }
}
declare module "runtime/module" {
    global  {
        interface Module {
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
    export class Module implements Module {
        name: string;
        url: string;
        requires: string[];
        members: any;
        exports: any;
        parent: Module;
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
        interface System {
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
        platform: string;
        module: Module;
        modules: ModuleMap;
        classes: ClassMap;
        import(name: string): Promise<any>;
        register(name: string, requires: string[], definer: Function): any;
        globals: any;
    }
    export default system;
}
