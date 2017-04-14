import {ComponentBase} from "@vendor/library/index";
import {ComponentOne} from "@vendor/library/index";
import {ComponentTwo} from "@vendor/library/index";
import {Cached} from "@ecmal/runtime/decorators";



declare const console;

const one = new ComponentOne();
const two = new ComponentTwo();

console.info(one instanceof ComponentBase,one.one());
console.info(two instanceof ComponentBase,two.two());

class CachedClass {
    constructor(){
        console.info("Cached");
    }
}
class Hello {
    @Cached
    get something(){
        return new CachedClass()
    }
}
let c1 = new Hello();
let c2 = new Hello();

console.info(c1.something===c1.something);
console.info(c2.something===c2.something);
console.info(c2.something!==c1.something);
