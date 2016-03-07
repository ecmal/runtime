/** @internal **/
namespace System {

    declare var window:any;
    declare var global:any;
    declare var process:any;


    const modules:any = Object.create(null);
    const helpers:any = {
        __extends(d:any, b:any) {
            d.$class = true;
            if(!b){ return }
            for (var p in b) {
                if (b.hasOwnProperty(p)) {
                    Object.defineProperty(d,p,Object.getOwnPropertyDescriptor(b,p));
                }
            }
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        }
    };

    System['register']=(id,requires,executor)=>{
        var module = modules[id] || (modules[id] = Object.create(null));
        module.requires = requires;
        module.exports = {};
        module.executor = executor((key,value)=>{
            module.exports[key]=value;
        },helpers);
        if(id=="runtime/system"){
            bootstrap();
        }
    };

    function execute(id){
        var module = modules[id];
        if(module.executor){
            var executor = module.executor;
            var requires = module.requires;
            delete module.executor;
            requires.forEach((r,i)=>{
                executor.setters[i](execute(r));
            });
            executor.execute();
            return module.exports;
        }else{
            return module.exports;
        }
    }

    function bootstrap(){
        delete System['register'];
        var Runtime = execute('runtime/system');
        Runtime.default = System;
        Object.setPrototypeOf(System,Runtime.System.prototype);
        Object.defineProperty(System,'constructor',{
           value : Runtime.System
        });
        System.constructor.call(System,modules);
        System['emit']('init');
    }
    //setTimeout(bootstrap)
}
