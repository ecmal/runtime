import {Meta} from "./decors"

@Meta(Reflect.Class)
export class Hello extends Object {

    @Meta(Reflect.Field)
    static field : String;

    @Meta(Reflect.Field)
    static fieldInitialized : String = "";

    @Meta(Reflect.Field)
    static fieldFunction : (a:string)=>string;

    @Meta(Reflect.Accessor)
    static get fieldAccessor():string{
        return "";
    }
    static set fieldAccessor(v:string){

    }

    @Meta(Reflect.Method)
    static method(
        @Meta(Reflect.Param) object:Object,
        @Meta(Reflect.Param) array:Array<any>,
        ...param:String[]
    ) : String {
        return ""
    }

    @Meta(Reflect.Field)
    field : String;

    @Meta(Reflect.Field)
    fieldInitialized : String = "";

    @Meta(Reflect.Field)
    fieldFunction : (a:string)=>string;

    @Meta(Reflect.Accessor)
    get fieldAccessor():string{
        return "";
    }
    set fieldAccessor(v:string){

    }

    @Meta(Reflect.Method)
    method(
        @Meta(Reflect.Param) object:Object,
        @Meta(Reflect.Param) array:Array<any>,
        ...param:String[]
    ) : String {
        return ""
    }
}