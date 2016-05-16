import {Model,Field} from "./model";
import {ISample, IOther} from "./models/sample";


@Field @Field('Hello')
export class User implements ISample,IOther{

    @Field @Field('Hello')
    test    : String;
    aaaa    : String;

    @Field @Field('Hello')
    get other (): IOther {return null}
    set other (@Field @Field('Hello') v: IOther) {}

    @Field @Field('Hello')
    public method (
        @Field @Field('Hello') param_1:string,
        @Field @Field('Hello') param_2?:number,
        ...hellos:IOther[]
    ):string{
        return "";
    }

    constructor (
        @Field @Field('Hello') param_1:string,
        @Field @Field('Hello') param_2?:number,
        ...hellos:IOther[]
    ) {  }

}
