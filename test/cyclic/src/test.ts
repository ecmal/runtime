import {Decor, Meta, DecorExtended} from "./decor/decors";

@Decor('Hello','world')
export class Decorated {
    @Meta(56) public hello;
    @DecorExtended(56) public extended;
}

export default new Decorated();