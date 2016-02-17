namespace Reflect {
    export enum Scope {
        STATIC, INSTANCE
    }
    export enum ModuleState {
        CREATED,
        LOADING,
        EVALUATING,
        DEFINING,
        EXECUTING,
        DONE,
        FAILED
    }
}