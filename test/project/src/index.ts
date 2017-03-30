import {ComponentBase} from "@vendor/library/index";
import {ComponentOne} from "@vendor/library/index";
import {ComponentTwo} from "@vendor/library/index";

declare const console;

const one = new ComponentOne();
const two = new ComponentTwo();

console.info(one instanceof ComponentBase,one.one());
console.info(two instanceof ComponentBase,two.two());
