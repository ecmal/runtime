import {Member} from "./member";
import {Type} from "./type";
import {Parameter} from "./parameter";

export class Method extends Member {
    public returns:Type;
    public parameters:Parameter[];
    public get value():Function{
        return this.descriptor.value
    }
    public invoke(target,...args):any{
        return this.value.apply(target,args);
    }
}