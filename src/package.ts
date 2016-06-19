interface Module {}
interface System {}

declare var module : Module;
/**
 * @internal
 */
declare var global,process,require,__filename:string,__dirname:string;

var system:System = <System> Object.create({
    import(module):Promise<any>{
        return this.init().then((cb)=>{
            return this.loader.import(module).then(
                m=>{
                    cb(true);
                    return m;
                },
                e=>{
                    cb(false);
                    throw e;
                }
            );
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
    on(event,callback){
        if(!this.events){
            this.events = {};
        }
        this.events[event] = callback;
    },
    register(name,requires,definer){
        var executed = false;
        if(!this.modules){
            this.started = Date.now();
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
                    switch(type){
                        case 'class'    :
                            value.__reflection = {type:type,module:this};
                            this.members[value.name] = value;
                            break;
                        case 'function' :
                            this.members[value.name] = value;
                            break;
                        case 'enum'     :
                            value.__reflection = {type:type,module:this};
                            this.members[value.constructor.name] = value;
                            break;
                        case 'interface' :
                            this.members[value] = {type:type,module:this,value};
                            this.exports[value] = this.members[value];
                            break;
                    }
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
            var Path =  modules['runtime/helpers'].exports.Path;
            Object.setPrototypeOf(system,System.prototype);
            for(let n in modules){
                var m:any = modules[n];
                m.requires = m.requires.map(r=>{
                    if(r[0]=='.'){
                        return Path.resolve(Path.dirname(m.name),r)
                    }else{
                        return r;
                    }
                });
                if(n.indexOf('runtime/')==0) {
                    m.definer.setters.forEach((s, i)=> {
                        s(modules[m.requires[i]].exports);
                    });
                }
                Object.setPrototypeOf(m,Module.prototype);
            }
            executeModule('runtime/system',system,Module.extend);
            System.call(system,process);
        }
    }
});
