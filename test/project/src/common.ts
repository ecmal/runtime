import {One} from "./common/one";
import {Two} from "./common/two";

export * from "./common/one";
export * from "./common/two";

export class Common {
    static config:any = {common:'common'};
    one:One;
    two:Two;
    constructor(){
        this.one = new One();
        this.two = new Two();
    }
}