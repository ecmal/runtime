export function signal(target,property){
    let desc = Object.getOwnPropertyDescriptor(target,property);
    delete desc.value;
    delete desc.writable;
    desc.get = function(){
        let listeners = new Set<Function>();
        function signal(...args){
            listeners.forEach(l=>l(...args))
        }
        Object.defineProperty(this,property,{
            configurable:true,
            writable:false,
            enumerable:false,
            value:signal
        })
        Object.defineProperty(signal,'attach',{
            value(l){
                listeners.add(l);
                return l;
            }
        })
        Object.defineProperty(signal,'detach',{
            value(l){
                listeners.delete(l);
                return l;
            }
        })
        return signal;
    }
    desc.set = function(v){
        throw new TypeError('cannot assign value to signal field of object')
    }
    
    Object.defineProperty(target,property,desc);
}