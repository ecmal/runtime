export class Modifier {
    static NONE              = 0;
    static STATIC            = 1;
    static PUBLIC            = 2;
    static PROTECTED         = 4;
    static PRIVATE           = 8;
    static DECORATED         = 16;
    static ABSTRACT          = 32;
    static EXPORT            = 64;
    static DEFAULT           = 128;
    static has(a:number,b:number):boolean{
        return (a&b)==b;
    }
}