/// <reference path="./core/index" />

/** @internal */
declare var __extends, __awaiter, __generator, __decorate, __metadata;
/** @internal */
declare var __dirname, __filename, global, process, require, window, document, XMLHttpRequest;

interface Error {
    [s: string]: any;
    cause(): Error;
    cause(ex: Error): this;
}
class Module {
    url: string;
    exports: any;
    requires: string[];
}
declare const module:Module;
class System {
    /**
     * @internal
     */
    static QUEUE = [];
}
namespace System {
    function initErrorExtension() {
        let CAUSE = Symbol('cause');
        Object.defineProperty(Error, 'prepareStackTrace', {
            value(error, stack) {
                let cause = error[CAUSE];
                while (cause) {
                    error.stack = `${error.stack}\n  Cause ${cause.stack}`
                    cause = cause[CAUSE];
                }
                if (error.stack) {
                    error.stack = error.stack.replace(/^(Error):\s+(.*)/, `${error.constructor.name}: $2`)
                }
            }
        });
        Object.defineProperty(Error.prototype, 'toJSON', {
            configurable: true,
            value() {
                let stack = this.stack.split('\n');
                return {
                    type: this.constructor.name,
                    message: this.message,
                    stack: stack
                }
            }
        })
        Object.defineProperty(Error.prototype, 'cause', {
            value() {
                if (arguments.length == 0) {
                    return this[CAUSE];
                } else {
                    this[CAUSE] = arguments[0];
                    return this;
                }
            }
        })
    }

    export type Modules = {
        readonly [k: string]: Module;
    }
    export interface ModuleSetter {
        (exports: any): void
    }
    export interface ModuleExporter {
        (name: string, value: any): void;
        (exports: any): void;
    }
    export interface ModuleExecutor {
        setters?: ModuleSetter[];
        execute?: () => void;
    }
    export interface ModuleDefiner {
        (exporter: ModuleExporter, module: Module): ModuleExecutor | void
    }
    export const root: string = '~';
    export const url: string = '~';
    export const modules: Modules = Object.create(null);
    export function register(path: string, requires: string[], definer: ModuleDefiner) {
        return doRegister(path, requires, definer);
    }
    export function load(name: string): any {
        return doImport(name);
    }
    Object.defineProperty(System, 'import', {
        configurable: true,
        value: (name: string) => {
            return doImport(name);
        }
    })
    class TsLib {
        execute(module, definer) {
            this.__context = module;
            definer.execute();
            this.__context = null;
            if (typeof module.emit == 'function') {
                module.emit('execute');
            }
        }
        __context: any;
        __extends(d, b) {
            if (b) {
                Object.setPrototypeOf(d, b);
                Object.setPrototypeOf(d.prototype, b.prototype);
            }
            Object.defineProperty(d.prototype, 'constructor', {
                configurable: true,
                value: d
            });
        }
        __awaiter(thisArg, _arguments, P, generator) {
            return new Promise(function (resolve, reject) {
                function fulfilled(value) {
                    try {
                        step(generator.next(value));
                    } catch (e) {
                        reject(e);
                    }
                }
                function rejected(value) {
                    try {
                        step(generator["throw"](value));
                    } catch (e) {
                        reject(e);
                    }
                }
                function step(result) {
                    result.done ? resolve(result.value) : new Promise(function (resolve) {
                        resolve(result.value);
                    }).then(fulfilled, rejected);
                }
                step((generator = generator.apply(thisArg, _arguments || [])).next());
            });
        }
        __generator(thisArg, body) {
            var _: any = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
            return { next: verb(0), "throw": verb(1), "return": verb(2) };
            function verb(n) { return function (v) { return step([n, v]); }; }
            function step(op) {
                if (f) throw new TypeError("Generator is already executing.");
                while (_) try {
                    if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
                    if (y = 0, t) op = [0, t.value];
                    switch (op[0]) {
                        case 0: case 1: t = op; break;
                        case 4: _.label++; return { value: op[1], done: false };
                        case 5: _.label++; y = op[1]; op = [0]; continue;
                        case 7: op = _.ops.pop(); _.trys.pop(); continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                            if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                            if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                            if (t[2]) _.ops.pop();
                            _.trys.pop(); continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
                if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
            }
        }
        __decorate(decorators, target, key, desc) {
            var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
            if (typeof Reflect === "object" && typeof Reflect['decorate'] === "function") {
                r = Reflect['decorate'](decorators, target, key, desc);
            } else {
                for (var i = decorators.length - 1; i >= 0; i--) {
                    if (d = decorators[i]) {
                        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
                    }
                }
            }
            return (c > 3 && r && Object.defineProperty(target, key, r), r);
        }
        __metadata(name, value) {
            if (typeof Reflect === "object" && typeof Reflect['metadata'] === "function") {
                return Reflect['metadata'](name, value, this.__context)
            } else {
                return (target, key?, desc?: PropertyDescriptor) => {
                    Mirror.new(target, key, desc).setMetadata(name, value);
                    return desc;
                }
            }
        }
        __param(paramIndex, decorator) {
            return function (target, key) {
                decorator(target, key, paramIndex);
            }
        }
    }
    let tslib: TsLib = new TsLib();
    let imports: any = Object.create(null);
    let platform: "app" | "web";
    let globals: any;
    let Mirror: any;

    // private api 
    function doRegister(...args) {
        let id: string = arguments[0];
        let requires: string = arguments[1];
        let definer: Function = arguments[2];
        let exports: any = Object.create(null);
        if (Array.isArray(id)) {
            requires = arguments[0];
            definer = arguments[1];
        }
        let module: any = { id, requires, exports };
        module.definer = definer((name, value) => {
            if (typeof name == 'string') {
                Object.defineProperty(exports, name, {
                    enumerable: true, value
                })
            } else
                if (typeof name == 'object') {
                    for (var i in name) {
                        Object.defineProperty(exports, i, {
                            enumerable: true, value: name[i]
                        })
                    }
                }
        }, module);
        Object.defineProperty(modules, id, {
            enumerable: true,
            configurable: true,
            value: module
        })
    }
    function doImport(name: string): Promise<any> {
        return new Promise((accept, reject) => {
            imports[name] = { accept, reject };
        })
    }
    function doExecute(id) {
        let module: any = modules[id];
        if (module && module.definer) {
            let definer = module.definer;
            let requires = module.requires;
            delete module.definer;
            requires.forEach((r, i) => {
                definer.setters[i](doExecute(r))
            });
            tslib.execute(module, definer);
        }
        return module.exports;
    }
    function doDetectPlatform() {
        if (typeof global != 'undefined' && typeof process != 'undefined') {
            globals = global;
            globals.System = System;
            globals.require = require;
            globals.process = process;
            globals.__filename = __filename;
            globals.__dirname = __dirname;
            return "app"
        } else
            if (typeof window != 'undefined') {
                globals = window;
                return "web"
            }
    }
    function doInitialize() {
        doExecute('@ecmal/runtime/module')
        doExecute('@ecmal/runtime/system')
        doExecute('@ecmal/runtime/reflect')

        let ModuleClass = modules['@ecmal/runtime/module'].exports.Module;
        let SystemClass = modules['@ecmal/runtime/system'].exports.System;
        Object.keys(modules).forEach(id => {
            Object.setPrototypeOf(modules[id], ModuleClass.prototype)
        });
        Object.setPrototypeOf(System, SystemClass.prototype);
        Mirror = modules['@ecmal/runtime/reflect'].exports.Mirror;

        SystemClass.call(System, platform, globals, imports);
        Object.keys(modules).forEach(id => {
            doExecute(id);
        });
    }

    function doBootstrap() {
        platform = doDetectPlatform();
        Object.defineProperties(globals, {
            System: { value: System },
        })
        doRegister('tslib', [], function (exports, context) {
            context.exports = tslib;
        })
        setTimeout(doInitialize, 0);
    }
    initErrorExtension();
    doBootstrap();
}

