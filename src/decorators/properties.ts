export const Constant:PropertyDecorator & MethodDecorator = (target:any,key:any,desc?:any):any=>{
    desc = Object.getOwnPropertyDescriptor(target,key);
    desc.writable = false;
    Object.defineProperty(target,key,desc);
    return desc;
}
export const Final:PropertyDecorator & MethodDecorator = (target:any,key:any,desc?:any):any=>{
    desc = Object.getOwnPropertyDescriptor(target,key);
    desc.configurable = false;
    Object.defineProperty(target,key,desc);
    return desc;
}
export const Hidden:PropertyDecorator & MethodDecorator = (target:any,key:any,desc?:any):any=>{
    try{
        desc = desc || Object.getOwnPropertyDescriptor(target,key) || {configurable:true,writable:true};
        desc.enumerable = false;
        console.info(key,desc);
        Object.defineProperty(target,key,desc);
        return desc;
    }catch(ex){
        console.info(ex)
    }    
}