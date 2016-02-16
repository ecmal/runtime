import {Meta} from "./decors"
@Meta(Runtime.Class)
export class Hello extends Object {

    @Meta(Runtime.Field)
    static field : String;

    @Meta(Runtime.Field)
    static fieldInitialized : String = "";

    @Meta(Runtime.Field)
    static fieldFunction : (a:string)=>string;

    @Meta(Runtime.Accessor)
    static get fieldAccessor():string{
        return "";
    };
    static set fieldAccessor(v:string){

    };

    @Meta(Runtime.Method)
    static method(
        @Meta(Runtime.Param) object:Object,
        @Meta(Runtime.Param) array:Array<any>,
        ...param:String[]
    ) : String {
        return ""
    }

    @Meta(Runtime.Field)
    field : String;

    @Meta(Runtime.Field)
    fieldInitialized : String = "";

    @Meta(Runtime.Field)
    fieldFunction : (a:string)=>string;

    @Meta(Runtime.Accessor)
    get fieldAccessor():string{
        return "";
    };
    set fieldAccessor(v:string){

    };

    @Meta(Runtime.Method)
    method(
        @Meta(Runtime.Param) object:Object,
        @Meta(Runtime.Param) array:Array<any>,
        ...param:String[]
    ) : String {
        return ""
    }
}