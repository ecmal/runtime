import {Class, Member} from "./reflect/class";
export class Decorator {
    public name:string;
    public type:Function;
    constructor(decorate?){
        if(decorate){
            this.type = decorate;
            this.name = decorate.constructor.name;
        }else{
            this.type = this.constructor;
            this.name = this.constructor.name;
        }
    }
    decorate(target:Class|Member){
        console.info(target)
    }
}
export class Type extends Decorator {}
export class Metadata extends Decorator {
    public name:string;
    public value:string;
    constructor(name:string,value:any){
        super();
        this.name = name;
        this.value = value;
    }
    decorate(target:Class|Member){
        target.metadata[this.name] = this.value;
    }
}
export class Parameter extends Decorator {}