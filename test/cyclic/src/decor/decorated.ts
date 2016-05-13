import Decor from "./decors"


@Decor @Decor('value')
export class Hello{
    constructor(
        @Decor @Decor('value') arg:string
    ){
        
    }
    @Decor
    @Decor('value')
    static property:string = 'value';

    @Decor
    @Decor('value')
    public static get accessor():string{return ''}
    public static set accessor(v:string){}

    @Decor
    @Decor('value')
    static method():string{
        return null;
    }

    @Decor @Decor('value')
    private property:string = 'value';

    @Decor
    @Decor('value')
    public get accessor():string{return ''}
    public set accessor(v:string){}

    @Decor @Decor('value')
    public method(
        @Decor @Decor('value') arg:string
    ):string{
        return null;
    }
}