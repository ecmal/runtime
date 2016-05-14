export class Decorator {

    public name:string;
    public type:Function;

    constructor(decorate?){
        if(decorate){
            this.decorate=decorate;
            this.type = decorate.constructor;
            this.name = decorate.constructor.name;
        }else{
            this.type = this.constructor;
            this.name = this.constructor.name;
        }
    }
    decorate(target,key,descriptor){
        console.info(target,key,descriptor)
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
}
export class Parameter extends Decorator {}