export * from "./common";
import {Common} from "./common";
import * as FS from "node/fs";

export default new Common();

console.info(Object.keys(FS));