namespace Reflect {
    export const METADATA:symbol = Symbol('metadata');
    export class Definition {
        static for(target:any,key?:string,index?:number):Definition {
            var scope:Scope,closure:Function;
            switch(typeof target){
                case "function" :
                    closure = target;
                    scope = Scope.STATIC;
                    break;
                case "object"   :
                    closure = target.constructor;
                    scope = Scope.INSTANCE;
                    break;
            }
            var cls:Class = closure[METADATA];
            if(cls && key){
                var member = cls.get(scope,key);
                if(member && typeof index=="number" && (member instanceof Method)){
                    return member.params[index];
                }else{
                    return member;
                }
            }else{
                if(typeof index=="number"){
                    return cls.params[index];
                }else{
                    return cls;
                }
            }
        }
        public name:string;
        public metadata:any;
        constructor(name:string){
            this.name = name;
            this.metadata = Object.create(null);
        }

        getMetadata(key){
            return this.metadata[Symbol.for(key)];
        }
        hasMetadata(key):boolean{
            return this.getMetadataKeys().indexOf(key)>=0;
        }
        getMetadataKeys(){
            return Object.getOwnPropertySymbols(this.metadata).map(k=>Symbol.keyFor(k));
        }
        setMetadata(key:any,value:any){
            this.metadata[Symbol.for(key)] = value;
        }
        deleteMetadata(key:any){
            delete this.metadata[Symbol.for(key)];
        }
        toJSON(...any):any{
            return {
                name: this.name,
                parent: this.constructor.name
            }
        }
    }
}