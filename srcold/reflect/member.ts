namespace Reflect {
    export class Member extends Definition {
        public owner:Class;
        public scope:Scope;
        public name:string;
        public type:Function;
        constructor(name:string,owner:Class,scope:Scope){
            super(name);
            this.owner = owner;
            this.scope = scope;
            this.name = name;
        }
        toJSON(){
            return {
                name            : this.name,
                kind            : this.constructor.name,
                owner           : this.owner.name,
                scope           : this.scope,
                type            : this.type?this.type.name:undefined
            };
        }
    }
    export class Param extends Definition {
        public owner:Definition;
        public type:Function;
        constructor(name:string,owner:Definition,type:Function){
            super(name);
            this.owner = owner;
            this.type = type;
        }
        toJSON(...any):any{
            return {
                name            : this.name,
                owner           : this.owner.name,
                type            : this.type?this.type.name:undefined
            };
        }
    }
    export class Method extends Member {
        public params:Param[];
        public returnType:Function;
        toJSON(...any):any{
            return {
                name            : this.name,
                kind            : this.constructor.name,
                owner           : this.owner.name,
                scope           : this.scope,
                type            : this.type?this.type.name:undefined,
                returnType      : this.returnType?this.returnType.name:undefined,
                params          : (()=>{
                    if(this.params && this.params.length) {
                        var map = Object.create(null), count = 0;
                        Object.keys(this.params).forEach((m:string)=> {
                            map[m] = this.params[m].toJSON();count++;
                        });
                        return count > 0 ? map : undefined;
                    }
                })()

            };
        }
    }
    export class Field extends Member {}
    export class Accessor extends Field {}
}