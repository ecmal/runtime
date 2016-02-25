namespace Reflect {
    export type Modules = {
        [name:string]:Module
    }
    export const MODULES:Modules = Object.create(null);
    export class Module extends Definition {
        static all():Module[] {
            return Object.keys(MODULES).map(name=>this.get(name));
        }
        static has(name:string):boolean{
            return !!this.get(name);
        }
        static get(name:string):Module {
            return MODULES[name];
        }

        public main:boolean;
        public url:string;
        public source:string;
        public exports:any;
        public state:ModuleState;
        public dependencies:string[];
        public dependants:string[];
        public classes:Classes;


        public get project():string{
            return this.name.split('/')[0];
        }
        public get path():string{
            return this.name.substr(this.project.length+1);
        }
        constructor(data:any){
            super(data.name);
            if(!MODULES[this.name]){
                MODULES[this.name] = this;
                this.url = data.url;
                this.main = data.main||false;
                this.source = data.source;
                this.exports = data.exports;
                this.dependencies = data.dependencies||[];
                this.dependants = data.dependants||[];
                this.classes = Object.create(null);
            }else{
                throw new Error(`Duplicate module definition with name '${this.name}'`);
            }
        }
        public add(cls:any){
            this.classes[cls.name] = cls;
        }
        public setClass(clazz:Class){
            this.classes[clazz.name] = clazz;
        }
        public getClass(name):Class{
            return this.classes[name];
        }
        public toJSON(...any):any{
            return {
                name            : this.name,
                url             : this.url,
                main            : this.main,
                source          : this.source,
                state           : ModuleState[this.state],
                dependencies    : this.dependencies,
                dependants      : this.dependants,
                exports         : (():any=>{
                    if(this.exports){
                        return Object.keys(this.exports)
                    }
                })(),
                classes         : (():any=>{
                    var map = Object.create(null),count=0;
                    Object.keys(this.classes).forEach((c:string)=>{
                        map[c] = this.classes[c].toJSON();count++
                    });
                    return count>0?map:undefined;
                })()
            };
        }
    }

}