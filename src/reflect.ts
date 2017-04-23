import {Module} from './module';

const MIRROR = Symbol('mirror');
const DESCRIPTOR:PropertyDescriptor = {
    configurable: true,
    enumerable: true,
    writable: true,
    value:null
};

export abstract class Mirror {
    static new(target:any,key?:string,desc?:PropertyDescriptor):Mirror{
        let module = Module.get('tslib').exports.__context;
        let clazz:Function,proto:Object,isStatic:boolean;
        if(typeof target=='function' && typeof target.prototype=='object'){
            clazz = target;
            proto = target.prototype;
            isStatic = true;
        } else
        if(typeof target=='object' && typeof(target.constructor)=='function'){
            clazz = target.constructor;
            proto = target;
            isStatic = false;
        }
        let mirror = clazz[MIRROR];
        if(!mirror){
            Object.defineProperty(clazz,MIRROR,{
                value : mirror=Object.create(ClassMirror.prototype,{
                    getModule       : {value:()=>module},
                    getId           : {value:()=>`${module.id}#${clazz.name}`},
                    getName         : {value:()=>clazz.name},
                    getType         : {value:()=>clazz},
                    getReturnType   : {value:()=>clazz},
                    getParamTypes   : {
                        configurable : true,
                        value(){
                            return []
                        }
                    }
                })
            });
        }
        if(!isStatic){
            mirror = mirror.getPrototype();
        }
        if(key){
            mirror = mirror.newMember(key,desc);
        }
        return mirror;    
    }
    static get(target:Function):ClassMirror
    static get(target:Object):ProtoMirror
    static get(target:Object,key:string):FieldMirror;
    static get(target:any,key?:string):Mirror{
        let clazz:Function,proto:Object,isStatic:boolean;
        if(typeof target=='function' && typeof target.prototype=='object'){
            clazz = target;
            proto = target.prototype;
            isStatic = true;
        } else
        if(typeof target=='object' && typeof(target.constructor)=='function'){
            clazz = target.constructor;
            proto = target;
            isStatic = false;
        }
        let mirror = clazz[MIRROR];
        if(mirror && !isStatic){
            mirror = mirror.prototype;
               
        }
        if(mirror && key){
            let o = mirror;
            mirror = mirror.getMember(key);
            if(!mirror){
                console.info(o,key)
            }
        }
        
        return mirror;
    }

    private get metadata(){
        return Object.defineProperty(this,'metadata',{
            value : Object.create(null)
        }).metadata;
    }
    protected constructor(){
        throw new Error('Mirror constructor cannot be called directly')
    }
    public abstract getId():string;
    public abstract getName():string;
    public abstract getType<T=any>():Constructor<T>;
    
    public getMetadata(key){
        return this.metadata[key];
    }
    public setMetadata(key,value){
        if(key=='design:typeinfo'){
            if(value.type){
                Object.defineProperty(this,'getType',{value:value.type})
            }
            if(value.paramTypes){
                Object.defineProperty(this,'getParamTypes',{value:value.paramTypes})
            }
            if(value.returnType){
                Object.defineProperty(this,'getReturnType',{value:value.returnType})
            }
        }else{
            this.metadata[key]=value;
        }
        return this;
    }
    public isMethod():this is MethodMirror{
        return this instanceof MethodMirror;
    }
    public isField():this is FieldMirror{
        return this instanceof FieldMirror;
    }
    public isClass():this is ClassMirror{
        return this instanceof ClassMirror;
    }
    public isPrototype():this is ProtoMirror{
        return this instanceof ProtoMirror;
    }
    public isParameter():this is ParamMirror{
        return this instanceof ParamMirror;
    }
}
export abstract class ClassMirror extends Mirror {
    private get members():FieldMirror[]{
        return Object.defineProperty(this,'members',{
            value:[]
        }).members
    }
    public abstract getModule():Module;
    public abstract getReturnType<T=any>():Constructor<T>;
    public abstract getParamTypes<T=any>():Constructor<T>;   
    public newMember(key:string,desc?:PropertyDescriptor,isStatic:boolean=true):FieldMirror{
        let member = this.getMember(key,isStatic);
        if(!member){
            let target = isStatic?this.getType():this.getType().prototype;
            let descriptor = desc;
            if(!descriptor){
                descriptor = Object.getOwnPropertyDescriptor(target,key);
            }
            if(!descriptor){
                 Object.defineProperty(target,key,descriptor = DESCRIPTOR);
            }
            let MemberType;
            if(typeof(descriptor.value)=='function'){
                MemberType = MethodMirror;
            }else{
                MemberType = FieldMirror;
            }
            member = Object.create(MemberType.prototype,{
                getId       : {value:()=>`${this.getId()}${isStatic?':':'.'}${key}`},
                getName     : {value:()=>key},
                getClass    : {value:()=>this},
                isStatic    : {value:()=>isStatic}
            })
            this.members.push(member);
        }
        return member;
    }
    public getPrototype():ProtoMirror{
        let mirror = this['prototype'];
        if(!mirror){
            Object.defineProperty(this,'prototype',{
                value : mirror = Object.create(ProtoMirror.prototype,{
                    getId : {value:()=>`${this.getId()}.prototype`},
                    getName : {value:()=>`prototype`},
                    getClass : { value:()=>this },
                    getMembers : { value:()=>this.getMembers(false) }
                })
            })
        }
        return mirror;
    }
    public getMember(key:string,isStatic=true):FieldMirror{
        return this.members.find(m=>(m.getName()==key && m.isStatic()==isStatic));
    }
    public getMembers(isStatic?:boolean):FieldMirror[]{
        if(typeof isStatic == 'undefined'){
            return this.members;
        }
        return this.members.filter(m=>m.isStatic()==isStatic);
    }
    public toString(){
        let members = this.members.map(m=>`  ${m.toString()}`);
        let body = members.length?`{\n${members.join('\n')}\n}`:'';
        return `${this.constructor.name}(${this.getName()}${body}`;
    }
}
export abstract class ProtoMirror extends Mirror {
    abstract getClass():ClassMirror;
    abstract getMembers():FieldMirror[];
    public getMember(key:string):FieldMirror{
        return this.getClass().getMember(key,false);
    }
    public newMember(key:string,desc?:PropertyDescriptor){
        return this.getClass().newMember(key,desc,false);
    }
}
export abstract class FieldMirror extends Mirror {
    public abstract getType<T=any>():Constructor<T>;
    public abstract getClass():ClassMirror;
    public abstract isStatic():boolean;
    public getTarget():any{
        let target = this.getClass().getType();
        if(!this.isStatic()){
            target = target.prototype;
        }
        return target;
    }
    public getDescriptor():PropertyDescriptor{
        return Object.getOwnPropertyDescriptor(this.getTarget(),this.getName());
    }
    public setDescriptor(desc:PropertyDescriptor){
        Object.defineProperty(this.getTarget(),this.getName(),desc);
    }
    public toString(){
        return `${this.constructor.name}(${this.getName()})`
    }
}
export abstract class MethodMirror extends FieldMirror {
    private get parameters():ParamMirror[]{
        let value = this.getDescriptor().value;
        let names = (()=>{
            var fnStr = value.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
            var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
            if(result === null)
                result = [];
            return result;
        })();
        let types = this.getParamTypes();
        function createParam(index,name,type){
            return Object.create(ParamMirror.prototype,{
                getId       : {value:()=>`${this.getId()}[${name}]`},
                getIndex    : {value:()=>index},
                getType     : {value:()=>type},
                getName     : {value:()=>name},
                getMethod   : {value:()=>this}
            })
        }
        return Object.defineProperty(this,'parameters',{
            value:types.map((t,i)=>createParam(i,names[i],t))
        }).parameters
    }
    public abstract getParamTypes():Constructor<any>[];
    public abstract getReturnType():Constructor<any>[];
    public getParameters(){
        return this.parameters
    }
    public getParameter(name:number|string){
        if(typeof name =='number'){
            return this.getParameters()[name]
        }else{
            return this.getParameters().find(p=>p.getName()==name);
        }
    }
}
export abstract class ParamMirror extends Mirror {
    public abstract getIndex():number;
    public abstract getMethod():MethodMirror;
}

