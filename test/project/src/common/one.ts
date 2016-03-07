import {Common} from "../common";
import {Three} from "./three";
export class One {
    type    : string;
    common  : Common;
    three   : Three = new Three();
    constructor(){
        this.type = this.constructor.name;
        this.common = Common.config;
    }
}