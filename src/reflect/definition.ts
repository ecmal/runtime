///<reference path="../package.ts"/>

const DEFINITIONS:any = Object.create(null);
const LOCK:symbol = DEFINITIONS.LOCKER = Symbol();

export class Definition {
    static [Symbol.for('lock')](){
        return LOCK;
    }
    static get map():any{
        return Object.defineProperty(this,'map',{
            value:Object.create(null)
        }).map;
    };

    public id:string;
    public name:string;
    public metadata:any;

    public getMetadata(key){
        return this.metadata[key];
    }
    public setMetadata(key,value){
        this.metadata[key]=value;
    }
    public set(key,value,enumerable=true,writable=false,configurable=false):Definition {
        return Object.defineProperty(this,key,{
            enumerable,writable,configurable,value
        });
    }
    constructor(lock,id){
        if(lock!=LOCK || !((this instanceof Definition) && typeof id=='string')){
            throw new Error(`${this.constructor.name} cant be instantiated`);
        }else{
            if(this.constructor['map'][id]){
                return this.constructor['map'][id];
            }else{
                Object.defineProperty(this.constructor['map'],id,{
                    enumerable:true,
                    value:this
                });
                this.set('id',id);
                this.set('metadata',Object.create(null));
            }
        }
    }
}

