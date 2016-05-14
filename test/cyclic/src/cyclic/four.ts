/*export var TOP:string='Hello';
export function Decor(){}
export enum Enum{
    VALUE_1,VALUE_2
}
@Decor
export class Four {
    @Decor
    static [TOP] = 'Hello';

    @Decor
    static staticVariable:string = 'Hello';

    @Decor
    static get staticAccessor():string{
        return this.staticVariable;
    }
    static set staticAccessor(v:string){
        this.staticVariable = v;
    }

    @Decor
    static staticFunction(@Decor v:string):string{
        return this.staticVariable = v;
    }


    @Decor
    public [TOP] = 'Hello';

    @Decor
    public memberVariable:string = 'Hello';

    @Decor
    public get memberAccessor():string{
        return this.memberVariable;
    }
    public set memberAccessor(v:string){
        this.memberVariable = v;
    }

    @Decor
    public memberFunction(@Decor v:string):string{
        return this.memberVariable = v;
    }

    constructor(value:string){
        this.memberVariable = value;
    }
    public toString(){
        return this.memberVariable;
    }
}
export default new Four('Four Default');
*/
export default "FOUR";