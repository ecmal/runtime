
export interface System {

}
export interface Project {

}
export interface Module {

}
export interface ModuleMember {}

export interface Function extends ModuleMember{

}
export interface Variable extends ModuleMember {

}
export interface Class extends ModuleMember {

}

export interface ClassMember {}
export interface Method extends ClassMember {
    invoke(...params:any[]):any;
}
export interface Field extends ClassMember {
    get(target:any):any;
    set(target:any,value:any):void;
}
export interface Parameter {}

export class Definition {
    constructor(id:string,g:symbol){
        if(g!=guard){
            throw new Error('Definition cant be instantiated');
        }
        Object.defineProperty(this,'id',{
            enumerable:true,
            configurable:false,
            writable:false,
            value:id
        })
    }
    public id:string;
    isProject(): this is Project {
        return true;
    }
    isModule(): this is Module {
        return true;
    }
    isModuleMember(): this is ModuleMember {
        return true;
    }
    isFunction():this is Function {
        return true;
    }
    isVariable():this is Variable {
        return true;
    }
    isClass(): this is Class {
        return true;
    }
    isClassMember(): this is ClassMember {
        return true;
    }
    isField(): this is Field {
        return true;
    }
    isMethod(): this is Method {
        return true;
    }
    setMetadata(){}
    getMetadata(){}
}

export class Module extends Definition {
    static get(id:string){
        return Project.get(id);
    }
}

export class Project extends Definition {
    static get(id:string):Project{
        var project:Project = this[Symbol.for(id)];
        if(!project){
            project = new Project(id,guard);
        }
        return project;
    }
}

export class System extends Definition {
    constructor(){
        if(!system) {
            super('', guard);
        }else{
            throw new Error('System is Singleton and cant be instantiated');
        }
    }
}

const guard:symbol = Symbol();
const system:System = new System();
