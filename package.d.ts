declare namespace Ecmal {
    abstract class Loader {
        main: string;
        runtime: string;
        current: Module;
        modules: Modules;
        options: any;
        cache: any;
        constructor();
        base: string;
        abstract eval(url: any): Promise<string>;
        abstract read(url: any): Promise<string>;
        bundle(contents: any): void;
        get(url: any): Module;
        register(name: string, dependencies: string[], executable: any): void;
        import(name: any): Promise<any>;
        fetch(module: Module): Promise<Module>;
        define(module: Module): Promise<Module>;
    }
    class ServerSideLoader extends Loader {
        constructor();
        static FS: any;
        static VM: any;
        runtime: string;
        main: string;
        get(name: any): Module;
        read(module: Module): Promise<Module>;
        eval(module: Module): Promise<Module>;
    }
    class ClientSideLoader extends Loader {
        script: any;
        runtime: string;
        main: string;
        read(module: Module): Promise<Module>;
        eval(module: Module): Promise<Module>;
    }
}
declare namespace Ecmal {
    enum Environment {
        SERVER = 0,
        CLIENT = 1,
    }
    function platform(...support: any[]): (target: any) => void;
    interface Module {
        id?: string;
        url?: string;
        parent?: string | Module;
        dependencies?: (string | Module)[];
        source?: string;
        executable?: ObjectConstructor;
        defined?: Boolean;
        exports?: any;
    }
    interface Modules {
        [key: string]: Module;
    }
}
declare namespace Ecmal {
    class Path {
        static SEP: string;
        static filename(path: String): string;
        static dirname(path: any): any;
        static normalize(path: any): string;
        static resolve(...paths: any[]): any;
    }
}
declare namespace Ecmal {
    class Runtime {
        static environment: Environment;
    }
    class System {
        loader: Loader;
        constructor();
        config(options: any): void;
        register(name: any, deps: any, exec: any): void;
        import(name: any): Promise<any>;
        bundle(content: any): void;
    }
    function run(): System;
}
declare const System: Ecmal.System;
