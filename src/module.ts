import {Emitter} from "./events";

export class Module extends Emitter  {
    /**
     * @internal
     */
    static add(name,requires,definer):Module{
        var m = new Module(name,requires,definer);
        Object.defineProperty(System.modules,name,{
            writable     : false,
            enumerable   : true,
            configurable : false,
            value        : m
        });
        return m;
    }
    /**
     * @internal
     */
    static get(name):Module{
        return <Module>(System.modules[name] || System.modules[`${name}/index`]);
    }

    public id:string;
    public url:string;
    public requires:string[];
    public members:any;
    public exports:any;
    public parent:Module;

    /**
     * @internal
     */
    public definer:any;
    /**
     * @internal
     */
    public constructor(name,requires,definer){
        super();
        this.id = name;
        this.requires = requires;
        this.members = Object.create(null);
        this.exports = Object.create(null);
        this.definer = definer((name,value)=>{
            if(typeof name == 'string'){
                Object.defineProperty(this.exports,name,{
                    enumerable:true,value
                })
            } else
            if(typeof name == 'object'){
                for(var i in name){
                    Object.defineProperty(this.exports,i,{
                        enumerable:true,value:name[i]
                    })
                }
            }
        },this);
    }
    

    /**
     * @internal
     */
    public execute(){
        if(this.definer){
            var definer = this.definer;
            delete this.definer;
            if(this.requires && this.requires.length){
                this.requires.forEach((r,i)=>{
                    var m:Module = Module.get(r);
                    if(m && m.execute){
                        definer.setters[i](m.execute());
                    }
                });
            }
            try{
                Module.get('tslib').exports.execute(this,definer);
            }catch(ex){
                var error = new Error(`module "${this.id}" execution error`);
                error.stack +=`\ncause : \n${ex.stack}`;
                throw error;
            }
        }
        return this.exports;
    }
    public toString(){
        return `Module(${this.id})`
    }
    private inspect(){
        return this.toString();
    }
    public export(name:string,value:any){
        this.exports[name] = value;
    }
}


