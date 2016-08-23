var system = Object.create({
    import: function (module) {
        var _this = this;
        return this.init().then(function (cb) {
            return _this.loader.import(module).then(function (m) {
                cb(true);
                return m;
            }, function (e) {
                cb(false);
                throw e;
            });
        });
    },
    init: function () {
        var _this = this;
        return new Promise(function (accept, reject) {
            if (!_this.promises) {
                _this.promises = [{ accept: accept, reject: reject }];
            }
            else {
                _this.promises.push({ accept: accept, reject: reject });
            }
        });
    },
    on: function (event, callback) {
        if (!this.events) {
            this.events = {};
        }
        this.events[event] = callback;
    },
    register: function (name, requires, definer) {
        var executed = false;
        if (!this.modules) {
            this.started = Date.now();
            this.modules = Object.create(null);
            initNodeJsDefaults();
            if (typeof setTimeout == 'function') {
                setTimeout(bootstrap);
            }
        }
        this.modules[name] = { name: name, requires: requires, definer: definer };
        return bootstrap;
        function initNodeJsDefaults() {
            if (typeof module != 'undefined' &&
                typeof global != 'undefined' &&
                typeof process != 'undefined') {
                global.system = system;
                system.node = {
                    module: module,
                    require: require,
                    process: process,
                    dirname: __dirname,
                    filename: __filename
                };
            }
        }
        function executeModule(name, system, extend) {
            var m = system.modules[name];
            if (m.definer) {
                var definer = m.definer;
                delete m.definer;
                if (m.requires && m.requires.length) {
                    m.requires.forEach(function (r) {
                        executeModule(r, system, extend);
                    });
                }
                m.init = function (target, parent) {
                    extend(target, parent);
                    if (target.__initializer) {
                        target.__initializer(parent);
                        delete target.__initializer;
                    }
                    return target;
                };
                definer.execute();
                delete m.init;
            }
        }
        function createModule(system, m) {
            var module = Object.create({
                define: function (type, value) {
                    switch (type) {
                        case 'class':
                            value.__reflection = { type: type, module: this };
                            this.members[value.name] = value;
                            break;
                        case 'function':
                            this.members[value.name] = value;
                            break;
                        case 'enum':
                            value.__reflection = { type: type, module: this };
                            this.members[value.constructor.name] = value;
                            break;
                        case 'interface':
                            this.members[value] = { type: type, module: this, value: value };
                            this.exports[value] = this.members[value];
                            break;
                    }
                },
                export: function (name, value) {
                    if (typeof name == "object") {
                        for (var k in name) {
                            this.exports[k] = name[k];
                        }
                    }
                    else {
                        this.exports[name] = value;
                    }
                }
            });
            module.name = m.name;
            module.exports = Object.create(null);
            module.members = Object.create(null);
            module.requires = m.requires;
            module.definer = m.definer(system, module);
            return module;
        }
        function bootstrap(process) {
            if (executed) {
                return;
            }
            executed = true;
            var modules = system.modules;
            for (var n in modules) {
                modules[n] = createModule(system, modules[n]);
            }
            var Module = modules['runtime/module'].exports.Module;
            var System = modules['runtime/system'].exports.System;
            var Path = modules['runtime/helpers'].exports.Path;
            Object.setPrototypeOf(system, System.prototype);
            for (var n in modules) {
                var m = modules[n];
                m.requires = m.requires.map(function (r) {
                    if (r[0] == '.') {
                        return Path.resolve(Path.dirname(m.name), r);
                    }
                    else {
                        return r;
                    }
                });
                if (n.indexOf('runtime/') == 0) {
                    m.definer.setters.forEach(function (s, i) {
                        s(modules[m.requires[i]].exports);
                    });
                }
                Object.setPrototypeOf(m, Module.prototype);
            }
            executeModule('runtime/system', system, Module.extend);
            System.call(system, process);
        }
    }
});
///<reference path="./package"/>
system.register("runtime/events", [], function(system,module,jsx) {
    var EVENTS, LISTENER;
    var Emitter = (function (__super) {
        Emitter.prototype.on = function (event, handler, options) {
            if (options === void 0) { options = {}; }
            var events = this[EVENTS];
            if (!events) {
                events = this[EVENTS] = Object.create(null);
            }
            var listeners = events[event];
            if (!listeners) {
                events[event] = [handler];
            }
            else {
                listeners.push(handler);
            }
            handler[LISTENER] = options;
        };
        Emitter.prototype.once = function (event, handler, options) {
            if (options === void 0) { options = {}; }
            options.once = true;
            this.on(event, handler, options);
        };
        Emitter.prototype.off = function (event, handler) {
            var events = this[EVENTS];
            if (events) {
                if (!handler) {
                    delete events[event];
                    return;
                }
                var listeners = events[event];
                if (listeners) {
                    events[event] = listeners = listeners.filter(function (l) {
                        if (handler == l) {
                            delete handler[LISTENER];
                            return false;
                        }
                        else {
                            return true;
                        }
                    });
                    if (listeners.length == 0) {
                        delete events[event];
                    }
                }
            }
            else {
                delete this[EVENTS];
            }
        };
        Emitter.prototype.emit = function (event) {
            var _this = this;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var events = this[EVENTS];
            if (events) {
                var listeners = events[event];
                if (listeners) {
                    return listeners.map(function (l) {
                        var options = l[LISTENER];
                        if (options) {
                            if (options.once) {
                                _this.off(event, l);
                            }
                            return l.apply(options.target, args);
                        }
                        else {
                            return l.apply(void 0, args);
                        }
                    });
                }
            }
        };
        return Emitter;
        function Emitter() {
        }
    })();
    module.define('class', Emitter);
    module.export("Emitter", Emitter);
    return {
        setters:[],
        execute: function() {
            EVENTS = Symbol('events');
            LISTENER = Symbol('listener');
            Emitter = module.init(Emitter);
        }
    }
});
system.register("runtime/reflect/declaration", ["runtime/events"], function(system,module,jsx) {
    var events_1;
    var Declaration = (function (__super) {
        Declaration.__initializer = function(__parent){
            __super=__parent;
        };
        return Declaration;
        function Declaration(name) {
            __super.call(this);
            Object.defineProperty(this, 'name', {
                enumerable: true,
                value: name
            });
            Object.defineProperty(this, 'metadata', {
                enumerable: true,
                value: Object.create(null)
            });
        }
    })();
    module.define('class', Declaration);
    module.export("Declaration", Declaration);
    return {
        setters:[
            function (events_1_1) {
                events_1 = events_1_1;
            }],
        execute: function() {
            Declaration = module.init(Declaration,events_1.Emitter);
        }
    }
});
system.register("runtime/module", ["runtime/reflect/class", "runtime/reflect/interface", "runtime/reflect/declaration"], function(system,module,jsx) {
    var class_1, interface_1, declaration_1;
    var REFLECT;
    var ModuleMap = module.define("interface","ModuleMap");
    var Module = (function (__super) {
        /**
         * @internal
         */
        Module.add = function (name, requires, definer) {
            var m = new Module(name, requires, definer);
            Object.defineProperty(system.modules, name, {
                writable: false,
                enumerable: true,
                configurable: false,
                value: m
            });
            system.emit('module', m);
            return m;
        };
        /**
         * @internal
         */
        Module.get = function (name) {
            return system.modules[name];
        };
        /**
         * @internal
         */
        Module.extend = function (a, b) {
            return class_1.Class.extend(a, b);
        };
        /**
         * @internal
         */
        Module.prototype.define = function (type, value) {
            value.__reflection = { type: type, module: this };
            switch (type) {
                case 'class':
                    this.members[value.name] = value;
                    break;
                case 'function':
                    this.members[value.name] = value;
                    break;
                case 'enum':
                    this.members[value.constructor.name] = value;
                    break;
                case 'interface':
                    this.members[value] = new interface_1.Interface(this, value);
                    this.exports[value] = this.members[value];
                    break;
            }
        };
        /**
         * @internal
         */
        Module.prototype.export = function (key, value) {
            if (typeof key == 'object') {
                for (var k in key) {
                    this.exports[k] = key[k];
                }
            }
            else {
                this.exports[key] = value;
            }
        };
        /**
         * @internal
         */
        Module.prototype.init = function (target, parent) {
            if (target && target.__reflection) {
                if (target.__reflection.type == 'class') {
                    target.__reflection.parent = parent;
                    var cls = target.class;
                    Object.defineProperty(this.members, cls.name, {
                        enumerable: true,
                        value: cls
                    });
                    return cls.value;
                }
            }
            return target;
        };
        /**
         * @internal
         */
        Module.prototype.resolve = function () {
            var _this = this;
            if (this.definer) {
                if (this.definer.setters && this.definer.setters.length) {
                    this.definer.setters.forEach(function (setter, i) {
                        var resolved = Module.get(_this.requires[i]);
                        if (resolved) {
                            setter(resolved.exports);
                        }
                        else {
                            console.info(_this.requires[i], Module.get(_this.requires[i]));
                        }
                    });
                    this.emit('resolve');
                }
                delete this.definer.setters;
            }
            return this;
        };
        /**
         * @internal
         */
        Module.prototype.execute = function () {
            if (this.definer) {
                this.resolve();
                var definer = this.definer;
                delete this.definer;
                if (this.requires && this.requires.length) {
                    this.requires.forEach(function (r) {
                        var m = Module.get(r);
                        if (m && m.execute) {
                            m.execute();
                        }
                    });
                }
                try {
                    definer.execute();
                    this.emit('execute');
                }
                catch (ex) {
                    var error = new Error("module \"" + this.name + "\" execution error");
                    error.stack += "\ncause : \n" + ex.stack;
                    throw error;
                }
            }
        };
        Module.prototype.toString = function () {
            return "Module(" + this.name + ")";
        };
        Module.prototype.inspect = function () {
            return this.toString();
        };
        Module.__initializer = function(__parent){
            __super=__parent;
        };
        return Module;
        /**
         * @internal
         */
        function Module(name, requires, definer) {
            __super.call(this, name);
            this.requires = requires;
            this.members = Object.create(null);
            this.exports = Object.create(null);
            this.exports[REFLECT] = this;
            this.definer = definer(system, this, system['jsx']);
        }
    })();
    module.define('class', Module);
    module.export("Module", Module);
    return {
        setters:[
            function (class_1_1) {
                class_1 = class_1_1;
            },
            function (interface_1_1) {
                interface_1 = interface_1_1;
            },
            function (declaration_1_1) {
                declaration_1 = declaration_1_1;
            }],
        execute: function() {
            REFLECT = Symbol('reflection');
            Module = module.init(Module,declaration_1.Declaration);
        }
    }
});
system.register("runtime/reflect/interface", ["runtime/reflect/declaration", "runtime/reflect/class", "runtime/module"], function(system,module,jsx) {
    var declaration_2, class_2, module_1;
    var Interface = (function (__super) {
        Interface.__initializer = function(__parent){
            __super=__parent;
        };
        return Interface;
        function Interface(module, name) {
            __super.call(this, name);
            Object.defineProperty(this, 'module', {
                enumerable: true,
                value: module
            });
            Object.defineProperty(this, 'id', {
                enumerable: true,
                value: this.module.name + "#" + this.name
            });
            Object.defineProperty(this, 'implementations', {
                enumerable: true,
                value: []
            });
            Object.defineProperty(system.classes, this.id, {
                enumerable: true,
                value: this
            });
        }
    })();
    module.define('class', Interface);
    module.export("Interface", Interface);
    return {
        setters:[
            function (declaration_2_1) {
                declaration_2 = declaration_2_1;
            },
            function (class_2_1) {
                class_2 = class_2_1;
            },
            function (module_1_1) {
                module_1 = module_1_1;
            }],
        execute: function() {
            Interface = module.init(Interface,declaration_2.Declaration);
        }
    }
});
system.register("runtime/reflect/type", ["runtime/reflect/interface", "runtime/reflect/class"], function(system,module,jsx) {
    var interface_2, class_3;
    var Type = (function (__super) {
        Type.get = function (reference) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            if (reference) {
                if (reference instanceof Type) {
                    return reference;
                }
                else {
                    return new Type(reference, params.map(function (p) { return Type.get(p); }));
                }
            }
        };
        Object.defineProperty(Type.prototype, "isParametrized", {
            get: function () {
                return this.parameters && this.parameters.length > 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type.prototype, "isClass", {
            get: function () {
                return (this.interface instanceof class_3.Class);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type.prototype, "class", {
            get: function () {
                if (this.isClass) {
                    return this.interface;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type.prototype, "parent", {
            get: function () {
                if (this.isClass) {
                    return this.class.parent.type;
                }
            },
            enumerable: true,
            configurable: true
        });
        Type.prototype.is = function (type) {
            if (type instanceof class_3.Class) {
                return this.isExtend(type);
            }
            else {
                return this.isImplement(type);
            }
        };
        Type.prototype.isExtend = function (type) {
            var ref = this.class;
            while (ref) {
                if (ref.id == type.id) {
                    return true;
                }
                else {
                    ref = ref.parent;
                }
            }
            return false;
        };
        Type.prototype.isImplement = function (type) {
            var ref = this.class;
            while (ref) {
                if (ref.interfaces) {
                    for (var _i = 0, _a = ref.interfaces; _i < _a.length; _i++) {
                        var impl = _a[_i];
                        if (impl.interface.id == type.id) {
                            return true;
                        }
                    }
                }
                ref = ref.parent;
            }
            return false;
        };
        return Type;
        function Type(value, params) {
            if (value instanceof Function) {
                Object.defineProperty(this, 'interface', {
                    enumerable: true,
                    configurable: true,
                    get: function () {
                        return Object.defineProperty(this, 'interface', {
                            enumerable: true,
                            configurable: true,
                            value: value.class
                        }).interface;
                    }
                });
            }
            else {
                Object.defineProperty(this, 'interface', {
                    enumerable: true,
                    configurable: true,
                    value: value
                });
            }
            Object.defineProperty(this, 'parameters', {
                enumerable: true,
                configurable: true,
                writable: false,
                value: params
            });
        }
    })();
    module.define('class', Type);
    module.export("Type", Type);
    return {
        setters:[
            function (interface_2_1) {
                interface_2 = interface_2_1;
            },
            function (class_3_1) {
                class_3 = class_3_1;
            }],
        execute: function() {
            Type = module.init(Type);
        }
    }
});
system.register("runtime/reflect/modifier", [], function(system,module,jsx) {
    var Modifier = (function (__super) {
        Modifier.has = function (a, b) {
            return (a & b) == b;
        };
        Modifier.__initializer = function(__parent){
            __super=__parent;
            Modifier.NONE = 0;
            Modifier.STATIC = 1;
            Modifier.PUBLIC = 2;
            Modifier.PROTECTED = 4;
            Modifier.PRIVATE = 8;
            Modifier.DECORATED = 16;
            Modifier.ABSTRACT = 32;
            Modifier.EXPORT = 64;
            Modifier.DEFAULT = 128;
        };
        return Modifier;
        function Modifier() {
        }
    })();
    module.define('class', Modifier);
    module.export("Modifier", Modifier);
    return {
        setters:[],
        execute: function() {
            Modifier = module.init(Modifier);
        }
    }
});
system.register("runtime/reflect/method", ["runtime/reflect/member", "runtime/reflect/type", "runtime/reflect/parameter"], function(system,module,jsx) {
    var member_1, type_1, parameter_1;
    var Method = (function (__super) {
        Object.defineProperty(Method.prototype, "value", {
            get: function () {
                return this.descriptor.value;
            },
            enumerable: true,
            configurable: true
        });
        Method.prototype.invoke = function (target) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return this.value.apply(target, args);
        };
        Method.__initializer = function(__parent){
            __super=__parent;
        };
        return Method;
        function Method() {
            return __super.apply(this, arguments);
        }
    })();
    module.define('class', Method);
    module.export("Method", Method);
    return {
        setters:[
            function (member_1_1) {
                member_1 = member_1_1;
            },
            function (type_1_1) {
                type_1 = type_1_1;
            },
            function (parameter_1_1) {
                parameter_1 = parameter_1_1;
            }],
        execute: function() {
            Method = module.init(Method,member_1.Member);
        }
    }
});
system.register("runtime/reflect/parameter", ["runtime/reflect/declaration", "runtime/reflect/type", "runtime/decorators", "runtime/reflect/method"], function(system,module,jsx) {
    var declaration_3, type_2, decorators_1, method_1;
    var Parameter = (function (__super) {
        Parameter.prototype.toString = function () {
            return this.constructor.name + "(" + this.id + ")";
        };
        Parameter.prototype.inspect = function () {
            return this.toString();
        };
        Parameter.__initializer = function(__parent){
            __super=__parent;
        };
        return Parameter;
        function Parameter(owner, name, index, flags, type) {
            __super.call(this, name);
            Object.defineProperty(this, 'owner', {
                enumerable: true,
                writable: false,
                configurable: false,
                value: owner
            });
            Object.defineProperty(this, 'index', {
                enumerable: true,
                writable: false,
                configurable: false,
                value: index
            });
            Object.defineProperty(this, 'id', {
                enumerable: true,
                value: this.owner.id + ":" + this.index + "." + this.name
            });
            Object.defineProperty(this, 'flags', {
                enumerable: true,
                writable: false,
                configurable: false,
                value: flags
            });
            Object.defineProperty(this, 'type', {
                enumerable: true,
                writable: false,
                configurable: false,
                value: type
            });
        }
    })();
    module.define('class', Parameter);
    module.export("Parameter", Parameter);
    return {
        setters:[
            function (declaration_3_1) {
                declaration_3 = declaration_3_1;
            },
            function (type_2_1) {
                type_2 = type_2_1;
            },
            function (decorators_1_1) {
                decorators_1 = decorators_1_1;
            },
            function (method_1_1) {
                method_1 = method_1_1;
            }],
        execute: function() {
            Parameter = module.init(Parameter,declaration_3.Declaration);
        }
    }
});
system.register("runtime/reflect/property", ["runtime/reflect/member"], function(system,module,jsx) {
    var member_2;
    var Property = (function (__super) {
        Object.defineProperty(Property.prototype, "setter", {
            get: function () {
                return this.descriptor.set;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Property.prototype, "getter", {
            get: function () {
                return this.descriptor.get;
            },
            enumerable: true,
            configurable: true
        });
        Property.prototype.get = function (target) {
            if (this.getter) {
                return this.getter.call(target);
            }
            else {
                return target[this.name];
            }
        };
        Property.prototype.set = function (target, value) {
            if (this.setter) {
                this.setter.call(target, value);
            }
            else {
                target[this.name] = value;
            }
            return this;
        };
        Property.__initializer = function(__parent){
            __super=__parent;
        };
        return Property;
        function Property() {
            return __super.apply(this, arguments);
        }
    })();
    module.define('class', Property);
    module.export("Property", Property);
    return {
        setters:[
            function (member_2_1) {
                member_2 = member_2_1;
            }],
        execute: function() {
            Property = module.init(Property,member_2.Member);
        }
    }
});
system.register("runtime/reflect/constructor", ["runtime/reflect/method"], function(system,module,jsx) {
    var method_2;
    var Constructor = (function (__super) {
        Constructor.prototype.new = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            return new ((_a = this.value).bind.apply(_a, [void 0].concat(args)))();
            var _a;
        };
        Constructor.__initializer = function(__parent){
            __super=__parent;
        };
        return Constructor;
        function Constructor() {
            return __super.apply(this, arguments);
        }
    })();
    module.define('class', Constructor);
    module.export("Constructor", Constructor);
    return {
        setters:[
            function (method_2_1) {
                method_2 = method_2_1;
            }],
        execute: function() {
            Constructor = module.init(Constructor,method_2.Method);
        }
    }
});
system.register("runtime/reflect/class", ["runtime/reflect/declaration", "runtime/decorators", "runtime/reflect/member", "runtime/reflect/interface", "runtime/reflect/type", "runtime/reflect/modifier", "runtime/reflect/parameter", "runtime/reflect/property", "runtime/reflect/method", "runtime/reflect/constructor", "runtime/module"], function(system,module,jsx) {
    var declaration_4, decorators_2, member_3, interface_3, type_3, modifier_1, parameter_2, property_1, method_3, constructor_1, module_2;
    var ClassMap = module.define("interface","ClassMap");
    var Class = (function (__super) {
        Class.extend = function (d, b) {
            if (b) {
                Object.setPrototypeOf(d, b);
                Object.setPrototypeOf(d.prototype, b.prototype);
            }
            Object.defineProperty(d.prototype, 'constructor', {
                configurable: true,
                value: d
            });
        };
        Class.isClass = function (target) {
            return target.class instanceof Class;
        };
        Object.defineProperty(Class.prototype, "type", {
            get: function () {
                return Object.defineProperty(this, 'type', {
                    value: type_3.Type.get(this)
                });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Class.prototype, "parent", {
            get: function () {
                var parent = null;
                if (this.value.prototype.__proto__) {
                    parent = this.value.prototype.__proto__.constructor.class;
                }
                Object.defineProperty(this, 'parent', {
                    configurable: true,
                    value: parent
                });
                return parent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Class.prototype, "parents", {
            get: function () {
                var parents = [];
                var parent = this.parent;
                while (parent) {
                    parents.push(parent);
                    parent = parent.parent;
                }
                return parents;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Class.prototype, "flags", {
            get: function () {
                return this.getConstructor().flags;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Class.prototype, "isExported", {
            get: function () {
                return modifier_1.Modifier.has(this.flags, modifier_1.Modifier.EXPORT);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Class.prototype, "isDefault", {
            get: function () {
                return modifier_1.Modifier.has(this.flags, modifier_1.Modifier.DEFAULT);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Class.prototype, "isDecorated", {
            get: function () {
                return modifier_1.Modifier.has(this.flags, modifier_1.Modifier.DECORATED);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Class.prototype, "isAbstract", {
            get: function () {
                return modifier_1.Modifier.has(this.flags, modifier_1.Modifier.ABSTRACT);
            },
            enumerable: true,
            configurable: true
        });
        Class.prototype.getMembers = function (filter) {
            var members = [];
            for (var m in this.members) {
                if (!filter || filter(this.members[m])) {
                    members.push(this.members[m]);
                }
            }
            return members;
        };
        Class.prototype.getAllMembers = function (filter) {
            var classes = this.parents.concat([this]);
            var members = Object.create(null);
            var cls = classes.shift();
            while (cls) {
                cls.getMembers(function (m) {
                    if (filter(m)) {
                        members[m.key] = m;
                        return true;
                    }
                    else {
                        return false;
                    }
                });
                cls = classes.shift();
            }
            return Object.keys(members).map(function (k) { return members[k]; });
        };
        Class.prototype.getConstructor = function () {
            return this.members[':constructor'];
        };
        Class.prototype.getMember = function (name, flags, descriptor) {
            if (flags === void 0) { flags = 0; }
            if (descriptor === void 0) { descriptor = false; }
            var isStatic = modifier_1.Modifier.has(flags, modifier_1.Modifier.STATIC);
            var key = "" + (isStatic ? '.' : ':') + name;
            var member = this.members[key];
            if (!member && !!descriptor) {
                var scope = isStatic ? this.value : this.value.prototype;
                var desc;
                if (typeof descriptor == 'object') {
                    Object.defineProperty(scope, name, desc = descriptor);
                }
                else if (descriptor) {
                    desc = Object.getOwnPropertyDescriptor(scope, name);
                }
                if (!desc) {
                    return;
                }
                if (isStatic) {
                    if (name != 'arguments' && name != 'caller' && name != 'prototype') {
                        if (typeof desc.value == 'function') {
                            member = new method_3.Method(this, name, flags, desc);
                        }
                        else {
                            member = new property_1.Property(this, name, flags, desc);
                        }
                    }
                }
                else {
                    if (typeof desc.value == 'function') {
                        if (name == 'constructor') {
                            member = new constructor_1.Constructor(this, name, flags, desc);
                        }
                        else {
                            member = new method_3.Method(this, name, flags, desc);
                        }
                    }
                    else {
                        member = new property_1.Property(this, name, flags, desc);
                    }
                }
                Object.defineProperty(this.members, key, {
                    enumerable: true,
                    value: member
                });
            }
            return member;
        };
        /**
         * @internal
         */
        Class.prototype.decorate = function (type, name, flags, designType, returnType, decorators, parameters, inheritance, interfaces) {
            var _this = this;
            var name = name || "constructor";
            var decorateMember = function (member, type, params) {
                var decorator = type;
                if (typeof type == "function") {
                    decorator = new (type.bind.apply(type, [void 0].concat(params)))();
                }
                if (typeof decorator == 'function') {
                    if (member instanceof constructor_1.Constructor) {
                        var value = decorator(_this.value);
                        if (typeof value == 'function' && value !== _this.value) {
                            Object.defineProperty(_this, 'value', {
                                configurable: true,
                                value: value
                            });
                        }
                    }
                    else if (member instanceof member_3.Member) {
                        var old = member.descriptor;
                        var value = decorator(member.scope, member.name, old);
                        if (typeof value == 'object' && (old.configurable != value.configurable ||
                            old.enumerable != value.enumerable ||
                            old.writable != value.writable ||
                            old.value != value.value ||
                            old.get != value.get ||
                            old.set != value.set)) {
                            member.descriptor = value;
                        }
                    }
                    else if (member instanceof parameter_2.Parameter) {
                        decorator(member.owner.scope, member.owner.name, member.index);
                    }
                }
                else if (decorator instanceof decorators_2.Decorator) {
                    if (member instanceof constructor_1.Constructor) {
                        var value = decorator.decorate(member);
                        if (typeof value == 'function' && value !== _this.value) {
                            Object.defineProperty(_this, 'value', {
                                configurable: true,
                                value: value
                            });
                        }
                    }
                    else if (member instanceof member_3.Member) {
                        var old = member.descriptor;
                        var value = decorator.decorate(member);
                        if (typeof value == 'object' && (old.configurable != value.configurable ||
                            old.enumerable != value.enumerable ||
                            old.writable != value.writable ||
                            old.value != value.value ||
                            old.get != value.get ||
                            old.set != value.set)) {
                            member.descriptor = value;
                        }
                    }
                    else {
                        decorator.decorate(member);
                    }
                }
                else if (decorator['decorate']) {
                    decorator['decorate'](member);
                }
                else {
                    for (var i in decorator) {
                        member.metadata[i] = decorator[i];
                    }
                }
                return decorator;
            };
            var member = this.getMember(name, flags);
            if (!member) {
                member = this.getMember(name, flags, {
                    enumerable: true,
                    writable: true,
                    configurable: true,
                    value: null
                });
            }
            Object.defineProperty(member, 'type', {
                enumerable: true,
                writable: true,
                configurable: true,
                value: type_3.Type.get(designType)
            });
            if (member instanceof method_3.Method) {
                if (parameters && parameters.length) {
                    Object.defineProperty(member, 'parameters', {
                        enumerable: true,
                        writable: true,
                        configurable: true,
                        value: parameters.map(function (p, i) {
                            var decorators = p[3];
                            var parameter = new parameter_2.Parameter(member, p[0], i, p[1], type_3.Type.get(p[2]));
                            if (decorators && decorators.length) {
                                Object.defineProperty(parameter, 'decorators', {
                                    enumerable: true,
                                    writable: true,
                                    configurable: true,
                                    value: decorators
                                        .map(function (d) { return decorateMember(parameter, d.shift(), d); })
                                        .filter(function (d) { return (d instanceof decorators_2.Decorator); })
                                });
                            }
                            return parameter;
                        })
                    });
                }
                if (member instanceof constructor_1.Constructor) {
                    Object.defineProperty(member, 'returns', {
                        enumerable: true,
                        writable: true,
                        configurable: true,
                        value: type_3.Type.get(this.value)
                    });
                    if (interfaces && interfaces.length) {
                        Object.defineProperty(this, 'interfaces', {
                            enumerable: true,
                            writable: true,
                            configurable: true,
                            value: interfaces.map(function (i) { return type_3.Type.get(i); })
                        });
                    }
                    if (inheritance && inheritance.length) {
                        Object.defineProperty(this, 'inheritance', {
                            configurable: true,
                            value: type_3.Type.get(inheritance[0])
                        });
                    }
                }
                else {
                    Object.defineProperty(member, 'returns', {
                        enumerable: true,
                        writable: true,
                        configurable: true,
                        value: type_3.Type.get(returnType)
                    });
                }
            }
            if (decorators && decorators.length) {
                Object.defineProperty(member, 'decorators', {
                    enumerable: true,
                    writable: true,
                    configurable: true,
                    value: decorators
                        .map(function (d) { return decorateMember(member, d.shift(), d); })
                        .filter(function (d) { return (d instanceof decorators_2.Decorator); })
                });
            }
            return this.value;
        };
        Class.prototype.toString = function () {
            return "Class(" + this.id + ")";
        };
        Class.prototype.inspect = function () {
            return this.toString();
        };
        Class.__initializer = function(__parent){
            __super=__parent;
        };
        return Class;
        function Class(value) {
            var _this = this;
            var module = system.modules['runtime/globals'];
            var reflection = value['__reflection'];
            var initializer = value['__initializer'];
            var decorator = value['__decorator'];
            delete value['__reflection'];
            delete value['__initializer'];
            delete value['__decorator'];
            if (reflection) {
                module = reflection.module;
            }
            __super.call(this, module, value.name);
            Object.defineProperty(this, 'original', {
                value: value
            });
            Object.defineProperty(this, 'value', {
                configurable: true,
                value: value
            });
            Object.defineProperty(this, 'members', {
                enumerable: true,
                value: Object.create(null)
            });
            if (value.prototype.__proto__) {
                Class.extend(value, value.prototype.__proto__.constructor);
            }
            if (reflection && reflection.parent) {
                Class.extend(value, reflection.parent);
            }
            Object.getOwnPropertyNames(this.value).forEach(function (name) {
                if (name != 'arguments' && name != 'caller' && name != 'prototype') {
                    _this.getMember(name, modifier_1.Modifier.PUBLIC | modifier_1.Modifier.STATIC, true);
                }
            });
            Object.getOwnPropertyNames(this.value.prototype).forEach(function (name) {
                _this.getMember(name, modifier_1.Modifier.PUBLIC, true);
            });
            Object.defineProperty(this.members, this.name, {
                value: this
            });
            if (decorator) {
                Object.defineProperty(this, 'value', {
                    configurable: true,
                    value: decorator(function (t, n, f, dt, rt, d, p, e, i) {
                        return _this.decorate(t, n, f, dt, rt, d, p, e, i);
                    }, type_3.Type.get) || this.value
                });
                if (this.inheritance) {
                    Class.extend(this.value, this.inheritance.class.value);
                }
            }
            if (initializer) {
                initializer(value.prototype.__proto__.constructor);
            }
        }
    })();
    module.define('class', Class);
    module.export("Class", Class);
    return {
        setters:[
            function (declaration_4_1) {
                declaration_4 = declaration_4_1;
            },
            function (decorators_2_1) {
                decorators_2 = decorators_2_1;
            },
            function (member_3_1) {
                member_3 = member_3_1;
            },
            function (interface_3_1) {
                interface_3 = interface_3_1;
            },
            function (type_3_1) {
                type_3 = type_3_1;
            },
            function (modifier_1_1) {
                modifier_1 = modifier_1_1;
            },
            function (parameter_2_1) {
                parameter_2 = parameter_2_1;
            },
            function (property_1_1) {
                property_1 = property_1_1;
            },
            function (method_3_1) {
                method_3 = method_3_1;
            },
            function (constructor_1_1) {
                constructor_1 = constructor_1_1;
            },
            function (module_2_1) {
                module_2 = module_2_1;
            }],
        execute: function() {
            Object.defineProperty(Function.prototype, 'class', {
                enumerable: true,
                configurable: true,
                get: function () {
                    return Object.defineProperty(this, 'class', {
                        enumerable: true,
                        configurable: false,
                        writable: false,
                        value: new Class(this)
                    }).class;
                }
            });
            Class = module.init(Class,interface_3.Interface);
        }
    }
});
system.register("runtime/reflect/member", ["runtime/reflect/declaration", "runtime/reflect/class", "runtime/decorators", "runtime/reflect/modifier", "runtime/reflect/type"], function(system,module,jsx) {
    var declaration_5, class_4, decorators_3, modifier_2, type_4;
    var Member = (function (__super) {
        Object.defineProperty(Member.prototype, "descriptor", {
            get: function () {
                return Object.getOwnPropertyDescriptor(this.scope, this.name);
            },
            set: function (v) {
                var old = this.descriptor;
                var changed = false;
                for (var i in v) {
                    if (old[i] !== v[i]) {
                        changed = true;
                    }
                }
                if (changed) {
                    //console.info("CHANGED",this.toString());
                    Object.defineProperty(this.scope, this.name, v);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Member.prototype, "key", {
            get: function () {
                return "" + (this.isStatic ? '.' : ':') + this.name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Member.prototype, "isStatic", {
            get: function () {
                return modifier_2.Modifier.has(this.flags, modifier_2.Modifier.STATIC);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Member.prototype, "isPublic", {
            get: function () {
                return modifier_2.Modifier.has(this.flags, modifier_2.Modifier.PUBLIC);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Member.prototype, "isProtected", {
            get: function () {
                return modifier_2.Modifier.has(this.flags, modifier_2.Modifier.PROTECTED);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Member.prototype, "isPrivate", {
            get: function () {
                return modifier_2.Modifier.has(this.flags, modifier_2.Modifier.PRIVATE);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Member.prototype, "isAbstract", {
            get: function () {
                return modifier_2.Modifier.has(this.flags, modifier_2.Modifier.ABSTRACT);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Member.prototype, "isDecorated", {
            get: function () {
                return modifier_2.Modifier.has(this.flags, modifier_2.Modifier.DECORATED);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Member.prototype, "scope", {
            get: function () {
                return this.isStatic ? this.owner.value : this.owner.value.prototype;
            },
            enumerable: true,
            configurable: true
        });
        Member.prototype.decorate = function (decorators) {
            var _this = this;
            if (!this.decorators) {
                Object.defineProperty(this, 'decorators', {
                    enumerable: true,
                    configurable: true,
                    writable: false,
                    value: []
                });
            }
            decorators.forEach(function (d) {
                _this.decorators.push(d);
                d.decorate(_this);
            });
        };
        Member.prototype.toString = function () {
            return this.constructor.name + "(" + this.owner.name + (this.isStatic ? '.' : ':') + this.name + ")";
        };
        Member.prototype.inspect = function () {
            return this.toString();
        };
        Member.__initializer = function(__parent){
            __super=__parent;
        };
        return Member;
        function Member(owner, name, flags, descriptor) {
            __super.call(this, name);
            if (this.constructor == Member) {
                throw new Error('Member is abstract class');
            }
            Object.defineProperty(this, 'owner', {
                enumerable: true,
                value: owner
            });
            Object.defineProperty(this, 'flags', {
                enumerable: true,
                configurable: true,
                value: flags
            });
            Object.defineProperty(this, 'id', {
                enumerable: true,
                value: "" + this.owner.id + this.key
            });
            if (!this.original) {
                Object.defineProperty(this, 'original', {
                    enumerable: true,
                    value: this.descriptor || descriptor
                });
            }
            if (descriptor) {
                this.descriptor = descriptor;
            }
        }
    })();
    module.define('class', Member);
    module.export("Member", Member);
    return {
        setters:[
            function (declaration_5_1) {
                declaration_5 = declaration_5_1;
            },
            function (class_4_1) {
                class_4 = class_4_1;
            },
            function (decorators_3_1) {
                decorators_3 = decorators_3_1;
            },
            function (modifier_2_1) {
                modifier_2 = modifier_2_1;
            },
            function (type_4_1) {
                type_4 = type_4_1;
            }],
        execute: function() {
            Member = module.init(Member,declaration_5.Declaration);
        }
    }
});
system.register("runtime/decorators", ["runtime/reflect/member", "runtime/reflect/method", "runtime/reflect/property", "runtime/reflect/constructor"], function(system,module,jsx) {
    var member_4, method_4, property_2, constructor_2;
    var Decorator = (function (__super) {
        Decorator.prototype.decorate = function (target) { };
        return Decorator;
        function Decorator() {
        }
    })();
    module.define('class', Decorator);
    module.export("Decorator", Decorator);
    var Bound = (function (__super) {
        Bound.prototype.decorate = function (target) {
            if (target instanceof method_4.Method) {
                var method = target.original;
                var name = target.name;
                target.descriptor = {
                    configurable: true,
                    get: function () {
                        return Object.defineProperty(this, name, {
                            enumerable: false,
                            configurable: true,
                            value: method.value.bind(this)
                        })[name];
                    }
                };
            }
            else {
                throw new Error("Invalid Bound annotation target " + target.toString());
            }
        };
        Bound.__initializer = function(__parent){
            __super=__parent;
        };
        return Bound;
        function Bound() {
            return __super.apply(this, arguments);
        }
    })();
    module.define('class', Bound);
    module.export("Bound", Bound);
    var Cached = (function (__super) {
        Cached.get = function (type, name) {
            if (type.metadata.singletone) {
                name = name || 'default';
            }
            if (name) {
                var instances = type[Cached.INSTANCES];
                if (!instances) {
                    instances = type[Cached.INSTANCES] = Object.create(null);
                }
                if (!instances[name]) {
                    instances[name] = new type.value();
                }
                return instances[name];
            }
            else {
                return new type.value();
            }
        };
        Cached.prototype.decorate = function (target) {
            if (target instanceof property_2.Property) {
                //console.info(`Cached(${target.toString()})`);
                try {
                    var method_5 = target.descriptor.get;
                    var name_1 = target.name;
                    if (!method_5) {
                        if (this.named) {
                            var named_1 = this.named;
                            method_5 = function () {
                                return Cached.get(target.type.class, named_1);
                            };
                        }
                        else {
                            method_5 = function () {
                                return Cached.get(target.type.class);
                            };
                        }
                    }
                    return {
                        configurable: true,
                        get: function () {
                            return Object.defineProperty(this, name_1, {
                                enumerable: false,
                                configurable: false,
                                writable: false,
                                value: method_5.call(this)
                            })[name_1];
                        }
                    };
                }
                catch (ex) {
                    throw new Error("Unable to Cache " + target.toString());
                }
            }
            else if (target instanceof constructor_2.Constructor) {
                target.owner.metadata.singletone = true;
            }
            else {
                throw new Error("Invalid Cache annotation target " + target.toString());
            }
        };
        Cached.__initializer = function(__parent){
            __super=__parent;
            Cached.INSTANCES = Symbol('instances');
        };
        return Cached;
        function Cached(name) {
            __super.call(this);
            this.named = name;
        }
    })();
    module.define('class', Cached);
    module.export("Cached", Cached);
    return {
        setters:[
            function (member_4_1) {
                member_4 = member_4_1;
            },
            function (method_4_1) {
                method_4 = method_4_1;
            },
            function (property_2_1) {
                property_2 = property_2_1;
            },
            function (constructor_2_1) {
                constructor_2 = constructor_2_1;
            }],
        execute: function() {
            Decorator = module.init(Decorator);
            Bound = module.init(Bound,Decorator);
            Cached = module.init(Cached,Decorator);
        }
    }
});
system.register("runtime/globals", [], function(system,module,jsx) {
    var globals;
    return {
        setters:[],
        execute: function() {
            globals = system.globals;
            module.export("default",globals);
        }
    }
});
system.register("runtime/helpers", [], function(system,module,jsx) {
    ///<reference path="./package"/>
    var Path = (function (__super) {
        Path.filename = function (path) {
            return path.split(Path.SEP).pop();
        };
        Path.dirname = function (path) {
            path = path.split('/');
            path.pop();
            path = path.join('/');
            return path;
        };
        Path.normalize = function (path) {
            if (!path || path === '/') {
                return '/';
            }
            var prepend = (path[0] == '/' || path[0] == '.');
            var target = [], src, scheme, parts, token;
            if (path.indexOf('://') > 0) {
                parts = path.split('://');
                scheme = parts[0];
                src = parts[1].split('/');
            }
            else {
                src = path.split('/');
            }
            for (var i = 0; i < src.length; ++i) {
                token = src[i];
                if (token === '..') {
                    target.pop();
                }
                else if (token !== '' && token !== '.') {
                    target.push(token);
                }
            }
            return ((scheme ? scheme + '://' : '') +
                (prepend ? '/' : '') +
                target.join('/').replace(/[\/]{2,}/g, '/'));
        };
        Path.resolve = function () {
            var paths = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                paths[_i - 0] = arguments[_i];
            }
            var current = paths.shift();
            for (var path = void 0, p = 0; p < paths.length; p++) {
                path = paths[p];
                if (path[0] == '/') {
                    current = path;
                }
                else {
                    current = Path.normalize(current + '/' + path);
                }
            }
            return current;
        };
        Path.moduleUrl = function (base, id) {
            return this.resolve(base, id + '.js');
        };
        Path.moduleId = function (base, url) {
            return url.replace(base + '/', '')
                .replace(/^(.*)\.js$/g, '$1');
        };
        Path.__initializer = function(__parent){
            __super=__parent;
            Path.SEP = '/';
        };
        return Path;
        function Path() {
        }
    })();
    module.define('class', Path);
    module.export("Path", Path);
    return {
        setters:[],
        execute: function() {
            Path = module.init(Path);
        }
    }
});
system.register("runtime/loaders/base", ["runtime/helpers", "runtime/module"], function(system,module,jsx) {
    var helpers_1, module_3;
    var Loader = (function (__super) {
        Loader.prototype.import = function (name, parent) {
            if (system.modules[name]) {
                var m = system.modules[name];
                m.execute();
                return Promise.resolve(m.exports);
            }
            else {
                return this.doImport(name, parent || system.module).then(function (m) {
                    system.emit('import', m);
                    return m.exports;
                });
            }
        };
        Loader.prototype.register = function (name, requires, definer) {
            this.registrations[name] = { requires: requires, definer: definer };
        };
        /**
         * @internal
         */
        Loader.prototype.doImport = function (name, parent) {
            var _this = this;
            return this.doLoadModule(name).then(function (r) { return _this.doDefineModules(); }).then(function (modules) {
                modules.forEach(function (m) { return m.resolve(); });
                module_3.Module.get(name).execute();
                modules.forEach(function (m) { return m.execute(); });
                modules.forEach(function (m) {
                    Object.defineProperty(m, 'parent', {
                        enumerable: true,
                        configurable: false,
                        writable: false,
                        value: parent
                    });
                });
                return system.modules[name];
            });
        };
        /**
         * @internal
         */
        Loader.prototype.doLoadModule = function (id) {
            var _this = this;
            this.registrations[id] = true;
            var url = helpers_1.Path.resolve(system.root, id + ".js");
            return this.loadModule(id, url).then(function (m) {
                _this.registrations[id].url = url;
                return _this.doLoadDependencies();
            });
        };
        /**
         * @internal
         */
        Loader.prototype.doLoadDependencies = function () {
            var _this = this;
            var requirements = [];
            for (var id in this.registrations) {
                var reg = this.registrations[id];
                if (reg.requires && reg.requires.length) {
                    reg.requires = reg.requires.map(function (r) {
                        if (r[0] == '.') {
                            return helpers_1.Path.resolve(helpers_1.Path.dirname(id), r);
                        }
                        else {
                            return r;
                        }
                    });
                    reg.requires.forEach(function (r) {
                        if (!_this.registrations[r] && !system.modules[r]) {
                            requirements.push(r);
                        }
                    });
                }
            }
            return Promise.all(requirements.map(function (r) { return _this.doLoadModule(r); }));
        };
        /**
         * @internal
         */
        Loader.prototype.doDefineModules = function () {
            var _this = this;
            return Object.keys(this.registrations).map(function (name) {
                var m = _this.registrations[name];
                delete _this.registrations[name];
                var sm = module_3.Module.add(name, m.requires, m.definer);
                Object.defineProperty(sm, 'url', {
                    enumerable: true,
                    configurable: false,
                    writable: false,
                    value: m.url || system.url
                });
                return sm;
            });
        };
        return Loader;
        function Loader() {
            if (!system.root) {
                this.detectRoot();
                Object.defineProperty(system, 'root', {
                    enumerable: true,
                    configurable: false,
                    writable: false,
                    value: helpers_1.Path.resolve(helpers_1.Path.dirname(system.url), '..')
                });
            }
            Object.defineProperty(this, 'registrations', {
                value: Object.create(null)
            });
        }
    })();
    module.define('class', Loader);
    module.export("Loader", Loader);
    return {
        setters:[
            function (helpers_1_1) {
                helpers_1 = helpers_1_1;
            },
            function (module_3_1) {
                module_3 = module_3_1;
            }],
        execute: function() {
            Loader = module.init(Loader);
        }
    }
});
system.register("runtime/loaders/node", ["runtime/loaders/base"], function(system,module,jsx) {
    var base_1;
    var NodeLoader = (function (__super) {
        Object.defineProperty(NodeLoader, "fs", {
            get: function () {
                return Object.defineProperty(this, 'fs', {
                    value: system.node.require('fs')
                }).fs;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NodeLoader, "vm", {
            get: function () {
                return Object.defineProperty(this, 'vm', {
                    value: system.node.require('vm')
                }).vm;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NodeLoader.prototype, "runtime", {
            get: function () {
                return __filename;
            },
            enumerable: true,
            configurable: true
        });
        NodeLoader.prototype.detectRoot = function () {
            Object.defineProperty(system, 'url', {
                enumerable: true,
                configurable: false,
                writable: false,
                value: this.runtime
            });
        };
        NodeLoader.prototype.loadModule = function (id, url) {
            var _this = this;
            return new Promise(function (accept, reject) {
                if (id.indexOf('node/') == 0) {
                    accept(_this.evalModule(id, url, _this.nodeModule(id)));
                }
                else {
                    NodeLoader.fs.readFile(url, 'utf8', function (err, data) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            accept(_this.evalModule(id, url, data.toString()));
                        }
                    });
                }
            });
        };
        NodeLoader.prototype.nodeModule = function (id) {
            return "system.register(\"" + id + "\",[], function(system,module) {\n            var exported = system.node.require(\"" + id.substr(5) + "\");\n            for(var name in exported){\n                module.export(name,exported[name]);\n            }\n            module.export('default',exported);\n        })";
        };
        NodeLoader.prototype.evalModule = function (id, url, data) {
            NodeLoader.vm.runInThisContext(data, {
                filename: url
            });
        };
        NodeLoader.__initializer = function(__parent){
            __super=__parent;
        };
        return NodeLoader;
        function NodeLoader() {
            var _this = this;
            __super.call(this);
            Object.defineProperty(system, 'loader', {
                configurable: true,
                value: this
            });
            var nodeModules = [];
            Object.keys(system.modules).forEach(function (k) {
                system.modules[k].requires.forEach(function (k) {
                    if (k.indexOf('node/') == 0 && nodeModules.indexOf(k) < 0) {
                        nodeModules.push(k);
                    }
                });
            });
            if (nodeModules.length) {
                nodeModules.forEach(function (k) {
                    _this.evalModule(k, system.url, _this.nodeModule(k));
                });
                this.doDefineModules();
            }
        }
    })();
    module.define('class', NodeLoader);
    module.export("NodeLoader", NodeLoader);
    return {
        setters:[
            function (base_1_1) {
                base_1 = base_1_1;
            }],
        execute: function() {
            NodeLoader = module.init(NodeLoader,base_1.Loader);
        }
    }
});
system.register("runtime/loaders/browser", ["runtime/loaders/base"], function(system,module,jsx) {
    var base_2;
    var BrowserLoader = (function (__super) {
        Object.defineProperty(BrowserLoader.prototype, "script", {
            get: function () {
                return Object.defineProperty(this, 'script', {
                    value: (function () {
                        var script = window.document.querySelector('script[main]');
                        if (!script) {
                            var scripts = window.document.querySelectorAll('script');
                            for (var i = 0; i < scripts.length; i++) {
                                if (scripts[i].src.endsWith('runtime/package.js')) {
                                    return scripts[i];
                                }
                            }
                        }
                        else {
                            return script;
                        }
                    })()
                }).script;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BrowserLoader.prototype, "runtime", {
            get: function () {
                return this.script.src;
            },
            enumerable: true,
            configurable: true
        });
        BrowserLoader.prototype.detectRoot = function () {
            Object.defineProperty(system, 'url', {
                enumerable: true,
                configurable: false,
                writable: false,
                value: this.runtime
            });
        };
        BrowserLoader.prototype.loadModule = function (id, url) {
            return new Promise(function (accept, reject) {
                var aHead = window.document.head;
                var aScript = window.document.createElement('script');
                aScript.type = 'text/javascript';
                aScript.id = id;
                aScript.src = url;
                aScript.onload = accept;
                aScript.onerror = reject;
                aHead.appendChild(aScript);
            });
        };
        BrowserLoader.__initializer = function(__parent){
            __super=__parent;
        };
        return BrowserLoader;
        function BrowserLoader() {
            return __super.apply(this, arguments);
        }
    })();
    module.define('class', BrowserLoader);
    module.export("BrowserLoader", BrowserLoader);
    return {
        setters:[
            function (base_2_1) {
                base_2 = base_2_1;
            }],
        execute: function() {
            BrowserLoader = module.init(BrowserLoader,base_2.Loader);
        }
    }
});
system.register("runtime/loader", ["runtime/loaders/base", "runtime/loaders/node", "runtime/loaders/browser"], function(system,module,jsx) {
    function exportStar_1(m) {
        var exports = {};
        for(var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        module.export(exports);
    }
    return {
        setters:[
            function (base_3_1) {
                exportStar_1(base_3_1);
            },
            function (node_1_1) {
                exportStar_1(node_1_1);
            },
            function (browser_1_1) {
                exportStar_1(browser_1_1);
            }],
        execute: function() {
        }
    }
});
system.register("runtime/system", ["runtime/events", "runtime/module", "runtime/loader", "runtime/reflect/class", "runtime/globals"], function(system,module,jsx) {
    var events_2, module_4, loader_1, loader_2, loader_3, class_5;
    var Globals = module.define("interface","Globals");
    var NodeGlobals = module.define("interface","NodeGlobals");
    var BrowserGlobals = module.define("interface","BrowserGlobals");
    var System = (function (__super) {
        Object.defineProperty(System.prototype, "classes", {
            get: function () {
                return Object.defineProperty(this, 'classes', {
                    value: Object.create(null)
                }).classes;
            },
            enumerable: true,
            configurable: true
        });
        System.prototype.import = function (name) {
            return this.loader.import(name);
        };
        System.prototype.register = function (name, requires, definer) {
            return this.loader.register(name, requires, definer);
        };
        Object.defineProperty(System.prototype, "globals", {
            get: function () {
                if (this.platform == 'browser') {
                    return window;
                }
                else {
                    return global;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(System.prototype, "platform", {
            get: function () {
                if (typeof global != 'undefined') {
                    global.system = system;
                    return Object.defineProperty(this, 'platform', {
                        enumerable: true,
                        writable: false,
                        configurable: false,
                        value: 'node'
                    }).platform;
                }
                else if (typeof window != 'undefined') {
                    window.system = system;
                    return Object.defineProperty(this, 'platform', {
                        enumerable: true,
                        writable: false,
                        configurable: false,
                        value: 'browser'
                    }).platform;
                }
            },
            enumerable: true,
            configurable: true
        });
        System.__initializer = function(__parent){
            __super=__parent;
        };
        return System;
        /**
         * @internal
         */
        function System(process) {
            var _this = this;
            __super.call(this);
            Object.defineProperty(this, 'jsx', {
                enumerable: false,
                writable: false,
                configurable: false,
                value: {}
            });
            Object.defineProperty(this, 'module', {
                enumerable: true,
                writable: false,
                configurable: false,
                value: module
            });
            Object.defineProperty(this, 'modules', {
                enumerable: true,
                writable: false,
                configurable: false,
                value: this.modules
            });
            if (typeof global != 'undefined') {
                global.system = system;
                Object.defineProperty(this, 'platform', {
                    enumerable: true,
                    writable: false,
                    configurable: false,
                    value: 'node'
                });
                Object.defineProperty(this, 'loader', {
                    enumerable: true,
                    writable: false,
                    configurable: false,
                    value: new loader_1.NodeLoader()
                });
            }
            else if (typeof window != 'undefined') {
                window.system = system;
                Object.defineProperty(this, 'platform', {
                    enumerable: true,
                    writable: false,
                    configurable: false,
                    value: 'browser'
                });
                Object.defineProperty(this, 'loader', {
                    enumerable: true,
                    writable: false,
                    configurable: false,
                    value: new loader_2.BrowserLoader()
                });
            }
            for (var n in this.modules) {
                var m = this.modules[n];
                if (m.name.indexOf('runtime/') == 0) {
                    for (var i in m.members) {
                        var member = m.members[i];
                        if (member.type == 'interface') {
                            m.define(member.type, member.value);
                        }
                        else if (member.__reflection.type == 'class') {
                            Object.defineProperty(m.members, i, {
                                enumerable: true,
                                value: member.class
                            });
                        }
                    }
                }
                if (!m.url) {
                    Object.defineProperty(m, 'url', {
                        enumerable: true,
                        configurable: false,
                        writable: false,
                        value: this.url
                    });
                }
                if (!m.parent) {
                    Object.defineProperty(m, 'parent', {
                        enumerable: true,
                        configurable: false,
                        writable: false,
                        value: m == module ? null : module
                    });
                }
            }
            if (this.events) {
                for (var i in this.events) {
                    this.on(i, this.events[i]);
                }
                delete this.events;
            }
            console.info("system started in " + (Date.now() - this['started']) / 1000 + " seconds", this.promises && this.promises.length);
            this.emit('init');
            if (this.promises && this.promises.length) {
                var resolved = [];
                var promise;
                while (promise = this.promises.shift()) {
                    resolved.push(new Promise(function (accept, reject) {
                        promise.accept(function (success) {
                            if (success) {
                                accept();
                            }
                            else {
                                reject();
                            }
                        });
                    }));
                }
                delete this.promises;
                Promise.all(resolved).then(function () { return _this.emit('load'); });
            }
            else {
                this.emit('load');
            }
        }
    })();
    module.define('class', System);
    module.export("System", System);
    return {
        setters:[
            function (events_2_1) {
                events_2 = events_2_1;
            },
            function (module_4_1) {
                module_4 = module_4_1;
            },
            function (loader_1_1) {
                loader_1 = loader_1_1;
                loader_2 = loader_1_1;
                loader_3 = loader_1_1;
            },
            function (class_5_1) {
                class_5 = class_5_1;
            },
            function (_1) {}],
        execute: function() {
            System = module.init(System,events_2.Emitter);
            module.export("default",system);
        }
    }
});
//# sourceMappingURL=package.js.map