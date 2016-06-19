///<reference path="./package"/>

const EVENTS:symbol = Symbol('events');
const LISTENER:symbol = Symbol('listener');

export class Emitter {
    public on(event:string,handler:Function):(options:any)=>void{
        var events = this[EVENTS];
        if(!events){
            events = this[EVENTS] = Object.create(null);
        }
        var listeners = events[event];
        if(!listeners){
            events[event] = [handler];
        }else{
            listeners.push(handler);
        }
        return (options:any)=>{
            handler[LISTENER] = Object.create(null);
            for(var option in options){
                handler[LISTENER][option] = options[option];
            }
        };
    }
    public once(event: string, handler: Function):(options:any)=>void {
        var options = this.on(event,handler);
        options({once:true});
        return options;
    }
    public off(event?:string,handler?:Function):void{
        var events = this[EVENTS];
        if(events){
            if(!handler){
                delete events[event];
                return;
            }
            var listeners = events[event];
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
        var events = this[EVENTS];
        if(events){
            var listeners = events[event];
            if(listeners){
                return listeners.map(l=>{
                    var options = l[LISTENER];
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