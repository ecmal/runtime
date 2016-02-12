namespace Reflect {

    enum MetadataTargetType {
        CLASS,FIELD,METHOD,ACCESSOR,PARAM
    }
    enum MetadataTargetScope {
        CLASS,INSTANCE
    }
    const METADATA:symbol = Symbol('metadata');
    var module:any;
    export function decorate(decorators, target, key, desc) {
        //console.info(module);
        var designModule = {
            id          : module.id,
            filename    : module.url,
            dirname     : Ecmal.Path.dirname(module.url),
            parent      : module.parent?module.parent.id:undefined,
            source      : module.source,
            deps        : module.dependencies && module.dependencies.length
                ? module.dependencies.map(m=>m.id)
                : []
        };
        //console.info(designModule)
        decorators.push(Reflect.metadata('design:module', designModule));
        var c = key?(desc?4:3):2, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    export function setCurrentModule(current){
        module = current;
    }
    export function metadata(name,value){
        return (target,key,desc)=>{
            setMetadata(target,key,desc,name,value);
        }
    }
    export function getDesignType(target,key):any{
        return getMetadata(target,key,'design:type')||Object;
    }
    export function getReturnType(target,key):any{
        return getMetadata(target,key,'design:returntype')||Object;
    }
    export function getParamTypes(target,key):any[]{
        return getMetadata(target,key,'design:paramtypes')||[];
    }
    export function setMetadata(target,key,desc,name,value){
        function detect(){
            var Class,Proto,Scope:MetadataTargetScope,Type:MetadataTargetType;
            if(typeof target == 'function'){
                Scope = MetadataTargetScope.CLASS;
                Class = target;
                Proto = target.prototype;
                //console.info('target:Class', target.name, 'key:',key,'desc:',desc,'name:',name);
            }else{
                Scope = MetadataTargetScope.INSTANCE;
                Class = target.constructor;
                Proto = target;
            }
            if(key){
                if(desc){
                    if(desc.value){
                        if(typeof desc.value=='function'){
                            Type = MetadataTargetType.METHOD;
                        }else{
                            Type = MetadataTargetType.FIELD;
                        }
                    }else
                    if(desc.get || desc.set){
                        Type = MetadataTargetType.ACCESSOR;
                    }
                }else{
                    Type = MetadataTargetType.FIELD;
                }
            }else{
                Type = MetadataTargetType.CLASS;
            }

            var id:string = `@${name}:${Type}#${Class.name}`;
            if(Type != MetadataTargetType.CLASS){
                switch(Scope){
                    case MetadataTargetScope.CLASS      :id = `${id}.${key}`;break;
                    case MetadataTargetScope.INSTANCE   :id = `${id}:${key}`;break;
                }
            }
            switch(name){
                case 'design:module'        : id = `${id}=${value.id}`;break;
                case 'design:type'          : id = `${id}=${value.name}`;break;
                case 'design:paramtypes'    : id = `${id}=(${value.map(i=>i.name).join(',')})`;break;
                case 'design:returntype'    : id = `${id}=>${value?value.name:'void'}`;break;
            }
            console.info(id);
        }
        //detect();
        var metadata = target[METADATA];
        if(!metadata){
            metadata = target[METADATA] = {};
        }
        if(key){
            var field = metadata[Symbol.for(key)];
            if(!field){
                field = metadata[Symbol.for(key)] = {};
            }
            metadata = field;
        }
        metadata[name] = value;
    }

    export function getMetadata(target,key,name){

        var type,metadata = target[METADATA];
        if(metadata){
            if(key){
                var field = metadata[Symbol.for(key)];
                if(field){
                    type = field[name];
                }
            }else{
                type = metadata[name];
            }
        }
        return type;
    }
}