declare namespace Runtime {
    class Path {
        static SEP: string;
        static filename(path: String): string;
        static dirname(path: any): any;
        static normalize(path: any): string;
        static resolve(...paths: any[]): any;
        static moduleUrl(base: any, id: any): any;
        static moduleId(base: any, url: any): any;
    }
}
declare namespace Reflect {
    enum Scope {
        STATIC = 0,
        INSTANCE = 1,
    }
    enum ModuleState {
        CREATED = 0,
        LOADING = 1,
        EVALUATING = 2,
        DEFINING = 3,
        EXECUTING = 4,
        DONE = 5,
        FAILED = 6,
    }
}
declare namespace Reflect {
    const METADATA: symbol;
    class Definition {
        static for(target: any, key?: string, index?: number): Definition;
        name: string;
        metadata: any;
        constructor(name: string);
        getMetadata(key: any): any;
        hasMetadata(key: any): boolean;
        getMetadataKeys(): string[];
        setMetadata(key: any, value: any): void;
        deleteMetadata(key: any): void;
        toJSON(...any: any[]): any;
    }
}
declare namespace Reflect {
    class Member extends Definition {
        owner: Class;
        scope: Scope;
        name: string;
        type: Function;
        constructor(name: string, owner: Class, scope: Scope);
        toJSON(): {
            name: string;
            kind: string;
            owner: string;
            scope: Scope;
            type: string;
        };
    }
    class Param extends Definition {
        owner: Definition;
        type: Function;
        constructor(name: string, owner: Definition, type: Function);
        toJSON(...any: any[]): any;
    }
    class Method extends Member {
        params: Param[];
        returnType: Function;
        toJSON(...any: any[]): any;
    }
    class Field extends Member {
    }
    class Accessor extends Field {
    }
}
declare namespace Reflect {
    type Classes = {
        [name: string]: Class;
    };
    class Class extends Definition {
        owner: Module;
        params: Param[];
        parent: Class;
        children: Class[];
        static: {
            [name: string]: Member;
        };
        instance: {
            [name: string]: Member;
        };
        constructor(module: Module, constructor: Function);
        get(scope: Scope, name: string): Member;
        members(filter?: (m: Member) => boolean): Member[];
        add(member: Member): void;
        toJSON(...any: any[]): any;
    }
}
declare namespace Reflect {
    type Modules = {
        [name: string]: Module;
    };
    const MODULES: Modules;
    class Module extends Definition {
        static all(): Module[];
        static has(name: string): boolean;
        static get(name: string): Module;
        main: boolean;
        url: string;
        source: string;
        exports: any;
        state: ModuleState;
        dependencies: string[];
        dependants: string[];
        classes: Classes;
        project: string;
        path: string;
        constructor(data: any);
        add(cls: any): void;
        setClass(clazz: Class): void;
        getClass(name: any): Class;
        toJSON(...any: any[]): any;
    }
}
declare namespace Reflect {
    function metadata(metadataKey: any, metadataValue: any): any;
    function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKey?: string): void;
    function hasMetadata(metadataKey: any, target: Object, targetKey?: string): boolean;
    function hasOwnMetadata(metadataKey: any, target: Object, targetKey?: string): boolean;
    function getMetadata(metadataKey: any, target: Object, targetKey?: string): any;
    function getOwnMetadata(metadataKey: any, target: Object, targetKey?: string): any;
    function getMetadataKeys(target: Object, targetKey?: string): any[];
    function getOwnMetadataKeys(target: Object, targetKey?: string): any[];
    function deleteMetadata(metadataKey: any, target: Object, targetKey?: string): boolean;
}
declare namespace Runtime {
    import Definition = Reflect.Definition;
    class ModuleDecorator {
        module: Module;
        constructor(module: any);
        __decorate(decorators: any, target: any, key: any, desc: any): any;
        __metadata(k: any, v: any): (target: any, key: any, desc: any) => void;
        __param(paramIndex: any, decorator: any): (target: any, key: any) => void;
        __extends(d: any, b: any): void;
        __define(target: any, key?: any, desc?: any): Definition;
    }
    class Module extends Reflect.Module {
        private definer;
        private executor;
        private error;
        isDefined: boolean;
        isEvaluated: boolean;
        isLoaded: boolean;
        isExecuted: boolean;
        define(): void;
        register(requires: string[], executor: Function): void;
        inject(module: Module, index: number): Module;
        execute(clean?: boolean): this;
        done(error?: any): Module;
    }
    class Loader {
        constructor();
        static global: any;
        static platform: any;
        import(uri: string): Promise<any>;
        module(id: string): Promise<Module>;
        register(requires: string[], executor: Function): void;
        bundle(content: any): void;
        protected runtime: string;
        protected current: Module;
        protected main: Module;
        protected root: any;
        protected get(id: any): Module;
        protected eval(module: Module): Promise<Module>;
        protected load(module: Module): Promise<Module>;
        protected execute(module: Module): Module;
        protected define(module: Module): Promise<Module>;
    }
}
declare namespace Runtime {
    class BrowserLoader extends Loader {
        script: any;
        runtime: string;
        protected eval(module: Module): Promise<Module>;
        protected load(module: Module): Promise<Module>;
    }
}
declare namespace Runtime {
    class NodeLoader extends Loader {
        private static fs;
        private static vm;
        protected context: any;
        protected runtime: string;
        protected eval(module: Module): Promise<Module>;
        protected load(module: Module): Promise<Module>;
    }
}
declare class System {
    constructor();
    static platform: string;
    static loader: Runtime.Loader;
    static modules: Reflect.Modules;
    static module(uri: string): Promise<Reflect.Module>;
    static import(uri: string): Promise<any>;
    static register(requires: string[], execute: Function): void;
    static bundle(content: any): void;
}
