import {One} from './One';
import {Two} from './Two';

export class Main {
    static from(target:any){
        console.info('Main.from',target);
    }
    public one:One = new One();
    public two:Two = new Two();
    constructor(){
        console.info(this);
    }
}

export default new Main();