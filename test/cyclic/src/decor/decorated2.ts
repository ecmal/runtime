import {Meta} from "./decors"
import metadata = Reflect.metadata;

@Meta(Runtime.Class)
export class Hello extends Object {
    static field : String;
    method (param:String){

    }
}