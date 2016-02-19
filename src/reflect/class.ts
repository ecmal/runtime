namespace Reflect {
    export type Classes = {
        [name:string]:Class
    };
    export class Class extends Definition {
        public owner:Module;
        public params:Param[];
        public parent:Class;
        public children:Class[];
        public static:{[name:string]:Member};
        public instance:{[name:string]:Member};
        constructor(module:Module,constructor:Function){
            super(constructor.name);
            this.owner = module;
            this.static = {};
            this.instance = {};
            this.constructor = constructor;
            this.owner.add(this)
        }
        get(scope:Scope,name:string){
            switch(scope){
                case Scope.STATIC   :
                    if(this.static[name]){
                        return this.static[name]
                    }
                    break;
                case Scope.INSTANCE :
                    if(this.instance[name]){
                        return this.instance[name]
                    }
                    break;
            }
        }
        members(filter?:(m:Member)=>boolean):Member[]{
            var result:Member[] = [];
            Object.keys(this.static).forEach(k=>{
                var member:Member = this.static[k];
                if(!filter || filter(member)){
                    result.push(member);
                }
            });
            Object.keys(this.instance).forEach(k=>{
                var member:Member = this.instance[k];
                if(!filter || filter(member)){
                    result.push(member);
                }
            });
            return result;
        }
        add(member:Member){
            switch(member.scope){
                case Scope.STATIC   : this.static[member.name] = member; break;
                case Scope.INSTANCE : this.instance[member.name] = member; break;
            }
        }
        toJSON(...any):any{
            return {
                name            : this.name,
                parent          : this.parent?this.parent.name:undefined,
                children        : (()=>{
                    return this.children
                        ? this.children.map(c=>c.name)
                        : undefined
                })(),
                params          : (()=>{
                    if(this.params && this.params.length) {
                        var map = Object.create(null), count = 0;
                        Object.keys(this.params).forEach((m:string)=> {
                            map[m] = this.params[m].toJSON();count++;
                        });
                        return count > 0 ? map : undefined;
                    }
                })(),
                members         : (()=>{
                    var map = Object.create(null),count=0;
                    Object.keys(this.static).forEach((m:string)=>{
                        map[`.${m}`] = this.static[m].toJSON();count++;
                    });
                    Object.keys(this.instance).forEach((m:string)=>{
                        map[`#${m}`] = this.instance[m].toJSON();count++;
                    });
                    return count>0?map:undefined;
                })()
            };
        }
    }
}