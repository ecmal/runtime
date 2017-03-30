import {ComponentBase} from "./base";

export class ComponentTwo extends ComponentBase{
    two(){
        return Object.assign(this.base("two"),{two:"self"});
    }
}