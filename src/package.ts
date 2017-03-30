/** @internal */
declare var __extends,__awaiter,__generator,__decorate,__metadata;
/** @internal */
declare var __dirname,__filename,global,process,require,window,console,document,setTimeout,XMLHttpRequest;
// module context
declare var __moduleName:string;

namespace System {
    export type Module  = {
        url : string;
        exports : any;
        requires : string[];
        export(name:string,value:any):void;
    }
    export type Modules = {
        [k:string]:Module
    }

    /** @internal */
    export type ModuleSetter = (exports:any)=>void;
    /** @internal */
    export type ModuleDefinition = {
        setters : ModuleSetter[],
        execute : ()=>void
    }
    /** @internal */
    export type ModuleDefiner = (exporter,context)=>ModuleDefinition;
    export const root:string = '~';
    export const url:string = '~';
    export const modules:Modules = Object.create(null);
    /** @internal */
    export function register(requires:string[],definer:ModuleDefiner)
    /** @internal */
    export function register(path:string,requires:string[],definer:ModuleDefiner)
    /** @internal */
    export function register(path:string|string[],requires:string[]|ModuleDefiner,definer?:ModuleDefiner)
    {
        return doRegister(path,requires,definer);
    }
    
    Object.defineProperty(System,'import',{
        configurable:true,
        value:(name:string)=>{
            return doImport(name);
        }
    })

    let imports:any = Object.create(null);
    let platform:"app"|"web";
    let globals:any;
    // private api 
    function doRegister(...args){
        let id:string = arguments[0];
        let requires:string = arguments[1];
        let definer:Function = arguments[2];
        let exports:any = Object.create(null);
        if(Array.isArray(id)){
            requires = arguments[0];
            definer = arguments[1];
        }
        let module:any = {id,requires,exports};
        module.definer = definer((name,value)=>{
            if(typeof name == 'string'){
                Object.defineProperty(exports,name,{
                    enumerable:true,value
                })
            } else
            if(typeof name == 'object'){
                for(var i in name){
                    Object.defineProperty(exports,i,{
                        enumerable:true,value:name[i]
                    })
                }
            }
        },module);
        modules[id] = module;
    }
    function doImport(name:string):Promise<any>{
        return new Promise((accept,reject)=>{
            imports[name] = {accept,reject};
        })
    }
    function doExecute(id){
        let module:any = modules[id];
        if(module.definer){
            let definer = module.definer;
            let requires = module.requires;
            delete module.definer;
            requires.forEach((r,i)=>{
                definer.setters[i](doExecute(r))
            })
            definer.execute();
        }
        return module.exports;
    }
    function doDetectPlatform(){
        if(typeof global!='undefined' && typeof process!='undefined'){
            globals = global;
            globals.System = System;
            globals.require = require;
            globals.process = process;
            globals.__filename = __filename;
            globals.__dirname = __dirname;
            return "app"
        }else
        if(typeof window!='undefined'){
            globals = window;
            return "web"
        }
    }
    function doInitialize(){
        Object.keys(modules).forEach(id=>doExecute(id));
        let ModuleClass = modules['@ecmal/runtime/module'].exports.Module;
        let SystemClass = modules['@ecmal/runtime/system'].exports.System;
        Object.keys(modules).forEach(id=>{
             Object.setPrototypeOf(modules[id],ModuleClass.prototype)
        });
        Object.setPrototypeOf(System,SystemClass.prototype);
        SystemClass.call(System,platform,globals,imports);
    }
    
    function doBootstrap(){
        
        platform = doDetectPlatform();
        Object.defineProperties(globals,{
            System    : {value:System},
            __extends : {
                value(d, b){
                    if(b){
                        Object.setPrototypeOf(d, b);
                        Object.setPrototypeOf(d.prototype, b.prototype);
                    }
                    Object.defineProperty(d.prototype, 'constructor', {
                        configurable    : true,
                        value           : d
                    });
                }
            },
            __awaiter : {
                value(thisArg, _arguments, P, generator){
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
            },
            __generator : {
                value(thisArg, body){
                    var _:any = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
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
            },
            __decorate : {
                value(decorators, target, key, desc){
                    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
                    if (typeof Reflect === "object" && typeof Reflect['decorate'] === "function") r = Reflect['decorate'](decorators, target, key, desc);
                    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
                    return c > 3 && r && Object.defineProperty(target, key, r), r;
                }
            },
            __metadata : {
                value(k, v) {
                    if (typeof Reflect === "object" && typeof Reflect['metadata'] === "function") return Reflect['metadata'](k, v);
                }
            },
        })
        doRegister('tslib',[],function(exports,context){
            context.exports = globals;
        })
        
        setTimeout(doInitialize,0);
    }

    doBootstrap();    
}

