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
        if(!this.registrations){
            var registrations = this.registrations = Object.create(null);
            setTimeout(()=>{
                var System,name='runtime/system';
                module=<Module>Object.create({
                    define(type,value){
                        if(!this.members){
                            this.members = Object.create(null)
                        }
                        this.members[value.name] = value;
                    },
                    export(name,value){
                        if(!this.exports){
                            this.exports = Object.create(null)
                        }
                        this.exports[name] = value;
                    },
                    init(target){
                        if(target.name=='System'){
                            System = target;
                        }
                        if(target.__initializer){
                            target.__initializer();
                            delete target.__initializer;
                        }
                    }
                });
                module['name']=name;
                registrations[name].definer(system,module).execute();
                delete registrations[name];
                Object.setPrototypeOf(system,System.prototype);
                System.call(system);
            })
        }
        this.registrations[name] = {requires,definer}
    }
});

