import Definition = Runtime.Definition;
import Method = Runtime.Method;

export function Meta(type):any{
    return (target,key,desc):any=>{
        var def = Definition.for(target,key,desc);
        console.info(type.name,def instanceof type);
        console.info(def);
        if(def instanceof Method){
            console.info(def.params)
        }
    }
}