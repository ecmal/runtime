import {Cached, Bound} from "./decor";


export class Test {

    static count:number=0;

    public count:number;
    public value:string;

    constructor(){
        this.value = "Test";
        this.count = Test.count++;
    }

    @Bound
    public toString(){
        return `${this.value}(${this.count})`;
    }

}

@Bound
export class User {

    public name:string;
    constructor(name:string){
        this.name = name;
    }

    @Cached
    public get test():Test{
        return new Test()
    }

    @Bound
    public print(){
        return console.info(`User(${this.name}${this.test})`);
    }
}

var u1:User = new User("U1");
setTimeout(u1.print,1000);
setTimeout(u1.print,2000);
setTimeout(u1.print,3000);

var u2:User = new User("U2");
setTimeout(u2.print,5000);
setTimeout(u2.print,5000);
setTimeout(u2.print,7000);


console.info(module.url)