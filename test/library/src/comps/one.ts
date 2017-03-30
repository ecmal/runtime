import {ComponentBase} from "./base";

export class ComponentOne extends ComponentBase {
    one(){
        return Object.assign(this.base("one"),{one:"self"});
    }
}