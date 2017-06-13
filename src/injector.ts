import { Mirror } from "./reflect";

/**
 * A decorator to tell the container that this class should be handled by the Singleton [[Scope]].
 *
 * ```
 * @ Singleton
 * class PersonDAO {
 *
 * }
 * ```
 *
 * Is the same that use:
 *
 * ```
 * Container.bind(PersonDAO).scope(Scope.Singleton)
 * ```
 */
export function Singleton(target: Function) {
    Container.bind(target).scope(Scope.Singleton);
}

/**
 * A decorator to tell the container that this class should be handled by the provided [[Scope]].
 * For example:
 *
 * ```
 * class MyScope extends Scope {
 *   resolve(iocProvider:Provider, source:Function) {
 *     console.log('created by my custom scope.')
 *     return iocProvider.get();
 *   }
 * }
 * @ Scoped(new MyScope())
 * class PersonDAO {
 * }
 * ```
 *
 * Is the same that use:
 *
 * ```
 * Container.bind(PersonDAO).scope(new MyScope());
 * ```
 * @param scope The scope that will handle instantiations for this class.
 */
export function Scoped(scope: Scope) {
    return function (target: Function) {
        Container.bind(target).scope(scope);
    }
}

/**
 * A decorator to tell the container that this class should instantiated by the given [[Provider]].
 * For example:
 *
 * ```
 * @ Provided({get: () => { return new PersonDAO(); }})
 * class PersonDAO {
 * }
 * ```
 *
 * Is the same that use:
 *
 * ```
 * Container.bind(PersonDAO).provider({
 *   get: () => { 
 *     return new PersonDAO(); 
 *   }
 * });
 * ```
 * @param provider The provider that will handle instantiations for this class.
 */
export function Provided(provider: Provider) {
    return function (target: Function) {
        Container.bind(target).provider(provider);
    }
}

/**
 * A decorator to tell the container that this class should be used as the implementation for a given base class.
 * For example:
 *
 * ```
 * class PersonDAO {
 * }
 *
 * @ Provides(PersonDAO)
 * class ProgrammerDAO extends PersonDAO{
 * }
 * ```
 *
 * Is the same that use:
 *
 * ```
 * Container.bind(PersonDAO).to(ProgrammerDAO);
 * ```
 * @param target The base class that will be replaced by this class.
 */
export function Provides(target: Function) {
    return function (to: Function) {
        Container.bind(target).to(to);
    }
}

let construct;
const ParentSymbol = Symbol('parent');
const SingletimeSymbol = Symbol('singletone');
/**
 * A decorator to tell the container that this class should its instantiation always handled by the Container.
 *
 * An Injectable class will have its constructor overriden to always delegate its instantiation to the IoC Container.
 * So, if you write:
 *
 * ```
 * @ Injectable
 * class PersonService {
 *   @ inject
 *   personDAO: PersonDAO;
 * }
 * ```
 *
 * Any PersonService instance will be created by the IoC Container, even when a direct call to its constructor is called:
 *
 * ```
 * let PersonService = new PersonService(); // will be returned by Container, and all internal dependencies resolved.
 * ```
 *
 * It is the same that use:
 *
 * ```
 * Container.bind(PersonService);
 * let personService: PersonService = Container.get(PersonService);
 * ```
 */
export function Injectable(target: Function) {//<T extends {new(...args:any[]):{}}>(target:T) {
    let newConstructor = InjectorHanlder.decorateConstructor(target) as any;
    let config: Config = <Config>Container.bind(target)
    config.toConstructor(newConstructor);
    return newConstructor;
}

/**
 * A decorator to request from Container that it resolve the annotated property dependency.
 * For example:
 *
 * ```
 * @ Injectable
 * class PersonService {
 *    constructor (@ inject creationTime: Date) {
 *       this.creationTime = creationTime;
 *    }    
 *    @ inject
 *    personDAO: PersonDAO;
 *
 *    creationTime: Date;
 * }
 *
 * ```
 *
 * When you call:
 *
 * ```
 * let personService: PersonService = Container.get(PersonService);
 * // The properties are all defined, retrieved from the IoC Container
 * console.log('PersonService.creationTime: ' + personService.creationTime); 
 * console.log('PersonService.personDAO: ' + personService.personDAO); 
 * ```
 */
export function inject(...args: any[]) {
    if (args.length < 3 || typeof args[2] === "undefined") {
        return InjectPropertyDecorator.apply(this, args);
    }
    else if (args.length == 3 && typeof args[2] === "number") {
        return InjectParamDecorator.apply(this, args);
    }
    throw new Error("Invalid @inject Decorator declaration.");
}

/**
 * The IoC Container class. Can be used to register and to retrieve your dependencies.
 * You can also use de decorators [[Injectable]], [[Scoped]], [[Singleton]], [[Provided]] and [[Provides]]
 * to configure the dependency directly on the class.
 */
export class Injector {
    /**
     * Add a dependency to the Container. If this type is already present, just return its associated 
     * configuration object.
     * Example of usage:
     *
     * ```
     * Container.bind(PersonDAO).to(ProgrammerDAO).scope(Scope.Singleton);
     * ```
     * @param source The type that will be bound to the Container
     * @return a container configuration
     */
    static bind(source: Function): Binding {
        if (!Container.isBound(source)) {
            Injectable(source);
            return Container.bind(source).to(source);
        }
        return Container.bind(source);
    }

    /**
     * Retrieve an object from the container. It will resolve all dependencies and apply any type replacement
     * before return the object.
     * If there is no declared dependency to the given source type, an implicity bind is performed to this type.
     * @param source The dependency type to resolve
     * @return an object resolved for the given source type;
     */
    static get(source: Function) {
        return Container.get(source);
    }
}
/**
 * Class responsible to handle the scope of the instances created by the Container
 */
export abstract class Scope {
    /**
     * A reference to the LocalScope. Local Scope return a new instance for each dependency resolution requested.
     * This is the default scope.
     */
    static Local: Scope;
    /**
     * A reference to the SingletonScope. Singleton Scope return the same instance for any 
     * dependency resolution requested.
     */
    static Singleton: Scope;

    /**
     * Method called when the Container needs to resolve a dependency. It should return the instance that will
     * be returned by the Container.
     * @param provider The provider associated with the current bind. Used to create new instances when necessary.
     * @param source The source type of this bind.
     * @return the resolved instance.
     */
    abstract resolve(provider: Provider, source: Function): any;

    /**
     * Called by the IoC Container when some configuration is changed on the Container binding.
     * @param source The source type that has its configuration changed.
     */
    reset(source: Function) {

    }
}
/**
 * A bind configuration for a given type in the IoC Container.
 */
export interface Binding {
    /**
     * Inform a given implementation type to be used when a dependency for the source type is requested.
     * @param target The implementation type
     */
    to(target: Object): this;
    /**
     * Inform a provider to be used to create instances when a dependency for the source type is requested.
     * @param provider The provider to create instances
     */
    provider(provider: Provider): this;
    /**
     * Inform a scope to handle the instances for objects created by the Container for this binding.
     * @param scope Scope to handle instances
     */
    scope(scope: Scope): this;

    /**
     * Inform the types to be retrieved from IoC Container and passed to the type constructor.
     * @param paramTypes A list with parameter types.
     */
    withParams(...paramTypes): this;
}
/**
 * A factory for instances created by the Container. Called every time an instance is needed.
 */
export interface Provider {
    /** 
     * Factory method, that should create the bind instance.
     * @return the instance to be used by the Container
     */
    get(): Object;
}

/**
 * Decorator processor for [[inject]] decorator on properties
 */
function InjectPropertyDecorator(target: Function, key: string) {
    let t = Mirror.get(target, key).getType();
    Container.injectProperty(target.constructor, key, t);
}
/**
 * Decorator processor for [[inject]] decorator on constructor parameters
 */
function InjectParamDecorator(target: Function, propertyKey: string | symbol, parameterIndex: number) {
    if (!propertyKey) { // only intercept constructor parameters 
        let config: Config = <Config>Container.bind(target)
        config.paramTypes = config.paramTypes || [];
        let t = Mirror.get(target, propertyKey as string, parameterIndex);
        config.paramTypes.unshift(t.getType());
    }
}

/**
 * Internal implementation of IoC Container.
 */
class Container {
    private static bindings: Map<FunctionConstructor, Config> = new Map<FunctionConstructor, Config>();

    static isBound(source: Function): boolean {
        checkType(source);
        const baseSource = InjectorHanlder.getConstructorFromType(source);
        let config: Config = Container.bindings.get(baseSource);
        return (!!config);
    }

    static bind(source: Function): Binding {
        checkType(source);
        const baseSource = InjectorHanlder.getConstructorFromType(source);
        let config: Config = Container.bindings.get(baseSource);
        if (!config) {
            config = new Config(baseSource);
            Container.bindings.set(baseSource, config);
        }
        return config;
    }

    static get(source: Function) {
        let config: Config = <Config>Container.bind(source);
        if (!config.iocprovider) {
            config.to(<FunctionConstructor>config.source);
        }
        return config.getInstance();
    }

    static injectProperty(target: Function, key: string, propertyType: Function) {
        Object.defineProperty(target.prototype, key, {
            enumerable: true,
            configurable: true,
            get: function () {
                return Object.defineProperty(this, key, {
                    enumerable: true,
                    configurable: true,
                    value: Container.get(propertyType)
                })[key]
            },
            set: (newValue) => {
                Object.defineProperty(this, key, {
                    enumerable: true,
                    configurable: true,
                    value: newValue
                })
            }
        });
    }

    static assertInstantiable(target: Function) {
        if (target[SingletimeSymbol]) {
            throw new TypeError("Can not instantiate Singleton class. " +
                "Ask Container for it, using Container.get");
        }
    }
}

/**
 * Utility function to validate type
 */
function checkType(source: Object) {
    if (!source) {
        throw new TypeError('Invalid type requested to IoC container. Type is not defined.');
    }
}

class Config implements Binding {
    source: Function;
    iocprovider: Provider;
    iocscope: Scope;
    decoratedConstructor: FunctionConstructor;
    paramTypes: Array<any>;

    constructor(source: Function) {
        this.source = source;
    }

    to(target: FunctionConstructor) {
        checkType(target);
        const targetSource = InjectorHanlder.getConstructorFromType(target);
        if (this.source === targetSource) {
            const _this = this;
            this.iocprovider = {
                get: () => {
                    const params = _this.getParameters();
                    if (_this.decoratedConstructor) {
                        return (params
                            ? new _this.decoratedConstructor(...params)
                            : new _this.decoratedConstructor()
                        );
                    }
                    return (params ? new target(...params) : new target());
                }
            };
        }
        else {
            this.iocprovider = {
                get: () => {
                    return Container.get(target);
                }
            };
        }
        if (this.iocscope) {
            this.iocscope.reset(this.source);
        }
        return this;
    }

    provider(provider: Provider) {
        this.iocprovider = provider;
        if (this.iocscope) {
            this.iocscope.reset(this.source);
        }
        return this;
    }

    scope(scope: Scope) {
        this.iocscope = scope;
        if (scope === Scope.Singleton) {
            this.source[SingletimeSymbol] = true;
            scope.reset(this.source);
        }
        else if (this.source[SingletimeSymbol]) {
            delete this.source[SingletimeSymbol];
        }
        return this;
    }

    withParams(...paramTypes) {
        this.paramTypes = paramTypes;
        return this;
    }

    toConstructor(newConstructor: FunctionConstructor) {
        this.decoratedConstructor = newConstructor;
        return this;
    }

    getInstance() {
        if (!this.iocscope) {
            this.scope(Scope.Local);
        }
        return this.iocscope.resolve(this.iocprovider, this.source);
    }

    private getParameters() {
        if (this.paramTypes) {
            return this.paramTypes.map(paramType => Container.get(paramType));
        }
        return null;
    }
}

/**
 * Default [[Scope]] that always create a new instace for any dependency resolution request
 */
class LocalScope extends Scope {
    resolve(provider: Provider, source: Function) {
        return provider.get();
    }
}

Scope.Local = new LocalScope();

/**
 * Scope that create only a single instace to handle all dependency resolution requests.
 */
class SingletonScope extends Scope {
    private static instances: Map<Function, any> = new Map<Function, any>();

    resolve(provider: Provider, source: Function) {
        let instance: any = SingletonScope.instances.get(source);
        if (!instance) {
            source[SingletimeSymbol] = false;
            instance = provider.get();
            source[SingletimeSymbol] = true;
            SingletonScope.instances.set(source, instance);
        }
        return instance;
    }

    reset(source: Function) {
        SingletonScope.instances.delete(InjectorHanlder.getConstructorFromType(source));
    }
}

Scope.Singleton = new SingletonScope();


/**
 * Utility class to handle injection behavior on class decorations.
 */
class InjectorHanlder {
    static decorateConstructor(target: Function) {
        let newConstructor = class InjectWrapper extends (<FunctionConstructor>target) {
            constructor(...args) {
                super(...args);
                Container.assertInstantiable(target);
            }
        }
        Object.defineProperty(newConstructor, 'name', {
            configurable: true,
            value: target.name
        })
        Object.defineProperty(newConstructor, ParentSymbol, {
            configurable: true,
            value: target
        })
        return newConstructor;
    }

    static getConstructorFromType(target: Function): FunctionConstructor {
        let typeConstructor: Function = target;
        if (!typeConstructor[ParentSymbol]) {
            return <FunctionConstructor>typeConstructor;
        }
        while (typeConstructor = typeConstructor[ParentSymbol]) {
            if (!typeConstructor[ParentSymbol]) {
                return <FunctionConstructor>typeConstructor;
            }
        }
        throw TypeError('Can not identify the base Type for requested target');
    }
}

