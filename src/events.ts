///<reference path="./package.ts"/>

const EVENTS:symbol = Symbol('events');
const LISTENER:symbol = Symbol('listener');

export class Emitter {
    public on(event:string,handler:Function,options:any={}):void{
        let events = this[EVENTS];
        if(!events){
            events = this[EVENTS] = Object.create(null);
        }
        let listeners = events[event];
        if(!listeners){
            events[event] = [handler];
        }else{
            listeners.push(handler);
        }
        handler[LISTENER]=options;
    }
    public once(event: string, handler:Function,options:any={}):void{
        options.once = true;
        this.on(event,handler,options);
    }
    public off(event?:string,handler?:Function):void{
        let events = this[EVENTS];
        if(events){
            if(!handler){
                delete events[event];
                return;
            }
            let listeners = events[event];
            if(listeners){
                events[event] = listeners = listeners.filter(l=>{
                    if(handler==l){
                        delete handler[LISTENER];
                        return false;
                    }else{
                        return true;
                    }
                });
                if(listeners.length==0){
                    delete events[event];
                }
            }
        }else{
            delete this[EVENTS];
        }
    }
    public emit(event:string,...args:any[]):any[]{
        let events = this[EVENTS];
        if(events){
            let listeners = events[event];
            if(listeners){
                return listeners.map(l=>{
                    let options = l[LISTENER];
                    if(options){
                        if(options.once){
                            this.off(event,l);
                        }
                        return l.apply(options.target,args);
                    }else{
                        return l.apply(void 0,args);
                    }
                });
            }
        }
    }
}