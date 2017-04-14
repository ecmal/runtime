export function Bound<T>(target:any,key:string,desc:TypedPropertyDescriptor<Function>){
    return {
        value(){
            return desc.value.apply(this,arguments);
        }
    }
}


