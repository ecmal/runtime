export type constant = PropertyDecorator & MethodDecorator;
function constant(target:any,key:any,desc?:any):any {
    desc = Object.getOwnPropertyDescriptor(target,key);
    desc.writable = false;
    Object.defineProperty(target,key,desc);
    return desc;
}

export type final = PropertyDecorator & MethodDecorator;
export function final(target:any,key:any,desc?:any):any {
    desc = Object.getOwnPropertyDescriptor(target,key);
    desc.configurable = false;
    Object.defineProperty(target,key,desc);
    return desc;
}

export type hidden = PropertyDecorator & MethodDecorator;
export function hidden(target:any,key:any,desc?:any):any{
    desc = desc || Object.getOwnPropertyDescriptor(target,key) || {configurable:true,writable:true};
    desc.enumerable = false;
    Object.defineProperty(target,key,desc);
    return desc;    
}