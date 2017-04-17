import {Mirror} from "../reflect";

export function Meta(object:object)
export function Meta(key:string,value:any)
export function Meta(target:any,value?:any):ClassDecorator|MethodDecorator|PropertyDecorator|ParameterDecorator{
    let metas = target;
    if(typeof target =='string'){
        metas = {[target]:value||true};
    }
    return (target,key:string,desc:PropertyDescriptor|number)=>{
        let mirror = Mirror.new(target,key,desc);
        if(mirror.isMethod() && typeof desc=='number'){
            mirror = mirror.getParameter(desc);
        }
        Object.keys(metas).forEach(k=>{
            mirror.setMetadata(k,metas[k]);
        })
    }
}