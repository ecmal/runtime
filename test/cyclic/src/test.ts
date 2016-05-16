import {Decor, Meta, DecorExtended} from "./decor/decors";

@Decor('Hello','world')
export class Decorated {
    @Meta(56)
    public hello;
    @DecorExtended(56)
    public extended;
    constructor(one:string,two:number){
        
    }
}
export default new Decorated('A',1);