import {Method} from "./method";

export class Constructor extends Method {
    public new(...args):any{
        return new (<{new(...args):any}>this.value)(...args);
    }
}