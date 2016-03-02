///<reference path="package.ts"/>

import {Module} from "./module"

var system:System;

export class System {
    constructor(modules){
        if(!system){
            system = this;
            Module.setup(modules);
        }else{
            throw new Error("System can't be instantiated")
        }
    }
    register(requires,definer){
        console.info(requires,definer);
    }
    import(){}
}

export class NodeSystem extends System {
    constructor(modules){
        super(modules)
    }
}

export class BrowserSystem extends System {
    constructor(modules){
        super(modules)
    }
}

export default system;