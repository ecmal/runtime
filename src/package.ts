
declare var module : Module;

interface Module {}
interface System {}

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
        function executeModule(name,system){
            var m = system.modules[name];
            if(m.definer){
                var definer = m.definer;
                delete m.definer;
                if(m.requires && m.requires.length){
                    m.requires.forEach(r=>{
                        executeModule(r,system)
                    });
                }
                definer.execute();
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
        if(!this.modules){
            this.modules = Object.create(null);
            setTimeout(()=>{
                var modules = system.modules;
                for(let n in modules){
                    modules[n] = createModule(system,modules[n]);
                }
                var Module =  modules['runtime/module'].exports.Module;
                var System =  modules['runtime/system'].exports.System;
                Object.setPrototypeOf(system,System.prototype);
                for(let n in modules){
                    var m = modules[n];
                    m.definer.setters.forEach((s,i)=>{
                        s(modules[m.requires[i]].exports);
                    });
                    Object.setPrototypeOf(m,Module.prototype);
                }
                executeModule('runtime/system',system);
                for(let n in modules){
                    executeModule(n,system);
                }
                System.call(system);
            })
        }
        this.modules[name] = {name,requires,definer}
    }
});

