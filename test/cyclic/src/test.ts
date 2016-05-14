import {Decor as Wow, Meta} from "./decor/decors";

@Wow('Hello','world')
class Decorated {
    @Meta(56) public hello;
}

export {Decorated as Hello};
export default new Decorated();