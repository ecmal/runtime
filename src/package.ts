/** @internal **/
namespace System {

    declare var window:any;
    declare var global:any;
    declare var process:any;

    const modules:any = Object.create(null);
    const helpers:any = {
        __extends(d, b=Object) {
            for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        }
    };

    System['register']=(id,requires,executor)=>{
        var module = modules[id] || (modules[id] = Object.create(null));
        module.requires = requires;
        module.exports = {};
        module.executor = executor.bind(helpers)((key,value)=>{
            module.exports[key]=value;
        });
    };

    function execute(id){
        var module = modules[id];
        var requires = module.requires;
        requires.forEach((r,i)=>{
            module.executor.setters[i](execute(r));
        });
        module.executor.execute();
        delete module.executor;
        return module.exports;
    }

    function bootstrap(){
        var Runtime = execute('runtime/system');
        Runtime.default = System;
        if(typeof window!='undefined'){
            Runtime = Runtime.BrowserSystem;
        } else
        if(typeof process=='object'){
            Runtime = Runtime.NodeSystem;
        }
        Object.setPrototypeOf(System,Runtime.prototype);
        Object.defineProperty(System,'constructor',{
           value : Runtime
        });
        System.constructor.call(System,modules);

    }

    setTimeout(bootstrap)
}
