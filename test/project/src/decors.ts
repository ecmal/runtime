import {Class} from "runtime/reflect/class";

function Decor(){}

export class Base{}

@Decor
export class Decorated extends Base {
    constructor(
        @Decor a:Decorated,
        @Decor b:Decorated
    ){super();}

    @Decor
    static field:Decorated;

    @Decor
    static method(
        @Decor a:Decorated,
        @Decor b:Decorated
    ):Decorated { return null }


    @Decor
    field:Decorated;

    @Decor
    method(
        @Decor a:Decorated,
        @Decor b:Decorated
    ):Decorated { return null }


}

