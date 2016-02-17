///<reference path="./reflect/enums.ts"/>
///<reference path="./reflect/definition.ts"/>
///<reference path="./reflect/member.ts"/>
///<reference path="./reflect/class.ts"/>
///<reference path="./reflect/module.ts"/>
namespace Reflect {


    export function metadata(metadataKey: any, metadataValue: any):any  {
        return (target:any,targetKey:any):void=>defineMetadata(metadataKey,metadataValue,target,targetKey);
    }
    export function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKey?: string): void {
        Definition.for(target,targetKey).setMetadata(metadataKey,metadataValue);
    }
    export function hasMetadata(metadataKey: any, target: Object, targetKey?: string): boolean {
        var cls:Class = <Class>Definition.for(target);
        while(cls){
            var def = Definition.for(cls.constructor,targetKey);
            if(def && def.hasMetadata(metadataKey)){
                return true;
            }else{
                cls = cls.parent;
            }
        }
        return false
    }
    export function hasOwnMetadata(metadataKey: any, target: Object, targetKey?: string): boolean {
        var def = Definition.for(target,targetKey);
        if(def){
            return def.hasMetadata(metadataKey)
        }else{
            return false;
        }
    }
    export function getMetadata(metadataKey: any, target: Object, targetKey?:string ): any {
        var cls:Class = <Class>Definition.for(target);
        while(cls){
            var def = Definition.for(cls.constructor,targetKey);
            if(def && def.hasMetadata(metadataKey)){
                return def.getMetadata(metadataKey);
            }else{
                cls = cls.parent;
            }
        }
        return null
    }
    export function getOwnMetadata(metadataKey: any, target: Object, targetKey?: string): any {
        var def = Definition.for(target,targetKey);
        if(def && def.hasMetadata(metadataKey)){
            return def.getMetadata(metadataKey);
        }else{
            return null;
        }
    }
    export function getMetadataKeys(target: Object, targetKey?: string): any[] {
        var cls:Class = <Class>Definition.for(target);
        var keys:any[];
        while(cls){
            var def = Definition.for(cls.constructor,targetKey);
            if(def){
                return keys = keys.concat(def.getMetadataKeys());
            }else{
                cls = cls.parent;
            }
        }
        return keys;
    }
    export function getOwnMetadataKeys(target: Object, targetKey?: string): any[] {
        var def = Definition.for(target,targetKey);
        if(def){
            return def.getMetadataKeys()
        }else{
            return []
        }
    }
    export function deleteMetadata(metadataKey: any, target: Object, targetKey?: string): boolean {
        var def = Definition.for(target,targetKey);
        if(def && def.hasMetadata(metadataKey)){
            def.deleteMetadata(metadataKey);
            return true;
        }else{
            return false
        }
    }
}