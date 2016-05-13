import {Declaration} from "./declaration";
import {Module} from "./module";


export class Class extends Declaration {
    public module:Module;
    public value:Function;
    constructor(module:Module,name:string,value:Function){
        super(name);
        Object.defineProperty(this,'module',{
            enumerable  : true,
            value       : module
        });
        Object.defineProperty(this,'value',{
            value       : value
        });
        function getParents(target){
            function getParent(target){
                if(target.__proto__){
                    return target.__proto__.constructor;
                }else {
                    return null;
                }
            }
            var parent=target,parents=[];
            while(parent && parent.prototype){
                if(parent=getParent(parent.prototype)){
                    parents.push(parent)
                }
            }
            return parents;
        }
    }
}