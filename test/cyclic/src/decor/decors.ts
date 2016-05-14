export class Decor {
    public key:string;
    public value:string;
    constructor(key:string,value:string){
        this.key = key;
        this.value = value;
    }
}

export function Meta(type):any{
    return (target,key,desc):any=>{
       
    }
}

export default new Decor('hello','world');