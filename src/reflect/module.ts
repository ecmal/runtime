import {Class} from "./class";
import {Declaration} from "./declaration";

declare global {
    interface Module extends Declaration {

    }
}
export class Module extends Declaration implements Module {
    url: string;
    requires: Set<string>;
    members: Map<string, any>;

    constructor(name:string,parent:Module){
        super(name);
        Object.defineProperty(this,'members',{
            enumerable  : true,
            value       : Object.create(null)
        });
        Object.defineProperty(this,'parent',{
            enumerable  : true,
            value       : parent
        });
    }

    /**
     * @internal
     */
    private initialize(reflection:symbol){
        function initClass(module:Module,name:string,ctor:Function){
            return Object.defineProperty(ctor,'class',{
                value:ctor[reflection] = new Class(module,name,ctor)
            }).class;
        }
        for(var i in this.members){
            var member = this.members[i];
            switch(member[reflection]){
                case 'class' : this.members[i] = initClass(this,i,member);
            }
        }
    }
}