import {Member} from "./member";

export class Property extends Member {
    public get setter():Function{
        return this.descriptor.set
    }
    public get getter():Function{
        return this.descriptor.get
    }
    public get(target:any){
        if(this.getter){
            return this.getter.call(target);
        }else{
            return target[this.name];
        }
    }
    public set(target:any,value:any):this{
        if(this.setter){
            this.setter.call(target,value);
        }else{
            target[this.name]=value;
        }
        return this;
    }
}