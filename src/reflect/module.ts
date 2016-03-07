///<reference path="../package.ts"/>
import {Definition} from "./definition";
import {Class} from "./class";

export class Module extends Definition {

    url             :string;
    exports         :any;
    classes         :Class[];
    dependencies    :Module[];
    dependants      :Module[];

    constructor(lock:symbol,id:string){
        super(lock,id);
    }
}