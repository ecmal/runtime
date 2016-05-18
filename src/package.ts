interface Module {}
interface System {}
declare var module : Module;
/**
 * @internal
 */
declare var global,process,require,__filename:string,__dirname:string;

var system:System = <System> Object.create({
    import(module):Promise<any>{
        return this.init().then(()=>{
            return this.loader.import(module)
        })
    },
    init():Promise<any>{
        return new Promise((accept,reject)=>{
            if(!this.promises){
                this.promises = [{accept,reject}]
            }else{
                this.promises.push({accept,reject});
            }
        })
    },
    register(name,requires,definer){
        var executed = false;
        if(!this.modules){
            this.modules = Object.create(null);
            initNodeJsDefaults();
            if(typeof setTimeout=='function'){
                setTimeout(bootstrap);
            }
        }
        this.modules[name] = {name,requires,definer};
        return bootstrap;
        function initNodeJsDefaults(){
            if(
                typeof module  != 'undefined' &&
                typeof global  != 'undefined' &&
                typeof process != 'undefined'
            ){
                global.system = system;
                system.node     = {
                    module      : module,
                    require     : require,
                    process     : process,
                    dirname     : __dirname,
                    filename    : __filename
                };
            }
        }
        function executeModule(name,system,extend){
            var m = system.modules[name];
            if(m.definer){
                var definer = m.definer;
                delete m.definer;
                if(m.requires && m.requires.length){
                    m.requires.forEach(r=>{
                        executeModule(r,system,extend)
                    });
                }
                m.init = function (target,parent){
                    extend(target,parent);
                    if(target.__initializer){
                        target.__initializer(parent);
                        delete target.__initializer;
                    }
                    return target;
                };
                definer.execute();
                delete m.init;
            }
        }
        function createModule(system,m){
            var module = Object.create({
                define(type,value){
                    this.members[value.name] = value;
                    value.__reflection = type;
                },
                export(name,value){
                    if(typeof name=="object"){
                        for(var k in name){
                            this.exports[k] = name[k];
                        }
                    }else{
                        this.exports[name] = value;
                    }
                }
            });
            module.name      = m.name;
            module.exports   = Object.create(null);
            module.members   = Object.create(null);
            module.requires  = m.requires;
            module.definer   = m.definer(system,module);
            return module;
        }
        function bootstrap(process){
            if(executed){
                return;
            }
            executed=true;
            var modules = system.modules;
            for(let n in modules){
                modules[n] = createModule(system,modules[n]);
            }
            var Module =  modules['runtime/module'].exports.Module;
            var System =  modules['runtime/system'].exports.System;
            Object.setPrototypeOf(system,System.prototype);
            for(let n in modules){
                var m:any = modules[n];
                m.definer.setters.forEach((s,i)=>{
                    s(modules[m.requires[i]].exports);
                });
                Object.setPrototypeOf(m,Module.prototype);
            }
            executeModule('runtime/system',system,Module.extend);
            for(let n in modules){
                executeModule(n,system,Module.extend);
            }
            System.call(system,process);
        }
       
    }
});
