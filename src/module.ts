///<reference path="package.ts"/>

export class Module {
    private static map:any;
    static setup(modules){
        delete this.setup;
        Object.defineProperty(this,'map',{
            value:modules
        });
        Object.keys(this.map).forEach(id=>{
            Object.setPrototypeOf(this.map[id],Module.prototype);
        });
        console.info("Modules.setup",this.map);
    }
}
