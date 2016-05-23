var system = Object.create({
    import: function (module) {
        var _this = this;
        return this.init().then(function () {
            return _this.loader.import(module);
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
    register: function (name, requires, definer) {
        var executed = false;
        if (!this.modules) {
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
                    this.members[value.name] = value;
                    value.__reflection = type;
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
system.register("runtime/events", [], function(system,module) {
    var EVENTS, LISTENER;
    var Emitter = (function (__super) {
        Emitter.prototype.on = function (event, handler) {
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
            return function (options) {
                handler[LISTENER] = Object.create(null);
                for (var option in options) {
                    handler[LISTENER][option] = options[option];
                }
            };
        };
        Emitter.prototype.once = function (event, handler) {
            var options = this.on(event, handler);
            options({ once: true });
            return options;
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
                            return l.apply.apply(l, [void 0].concat(args));
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
system.register("runtime/reflect/declaration", ["runtime/events"], function(system,module) {
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
system.register("runtime/decorators", ["runtime/reflect/declaration"], function(system,module) {
    var declaration_1;
    var Decorator = (function (__super) {
        Decorator.prototype.decorate = function (target) { };
        return Decorator;
        function Decorator() {
        }
    })();
    module.define('class', Decorator);
    module.export("Decorator", Decorator);
    var Metadata = (function (__super) {
        Metadata.prototype.decorate = function (target) {
            console.info("METADATA DECORATOR " + target.toString());
        };
        Metadata.__initializer = function(__parent){
            __super=__parent;
        };
        return Metadata;
        function Metadata(name, value) {
            __super.call(this);
            Object.defineProperty(this, 'name', {
                enumerable: true,
                writable: false,
                configurable: false,
                value: name,
            });
            Object.defineProperty(this, 'value', {
                enumerable: true,
                writable: false,
                configurable: false,
                value: value,
            });
        }
    })();
    module.define('class', Metadata);
    module.export("Metadata", Metadata);
    return {
        setters:[
            function (declaration_1_1) {
                declaration_1 = declaration_1_1;
            }],
        execute: function() {
            Decorator = module.init(Decorator);
            Metadata = module.init(Metadata,Decorator);
        }
    }
});
system.register("runtime/helpers", [], function(system,module) {
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
system.register("runtime/reflect/class", ["runtime/reflect/declaration", "runtime/decorators"], function(system,module) {
    var declaration_2, decorators_1;
    var ClassMap = module.define("interface","ClassMap");
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
    var Type = (function (__super) {
        Type.get = function (reference) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            if (reference instanceof Type) {
                return reference;
            }
            else {
                return new Type(reference, params);
            }
        };
        return Type;
        function Type(value, params) {
            Object.defineProperty(this, 'reference', {
                enumerable: true,
                configurable: true,
                get: function () {
                    if (value instanceof Function) {
                        return value.class;
                    }
                    else {
                        return value;
                    }
                }
            });
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
        Object.defineProperty(Member.prototype, "isStatic", {
            get: function () {
                return Modifier.has(this.flags, Modifier.STATIC);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Member.prototype, "isPublic", {
            get: function () {
                return Modifier.has(this.flags, Modifier.PUBLIC);
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
                value: "" + this.owner.id + (this.isStatic ? '.' : ':') + this.name
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
    var Property = (function (__super) {
        Property.__initializer = function(__parent){
            __super=__parent;
        };
        return Property;
        function Property() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Property);
    module.export("Property", Property);
    var Method = (function (__super) {
        Method.__initializer = function(__parent){
            __super=__parent;
        };
        return Method;
        function Method() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Method);
    module.export("Method", Method);
    var Constructor = (function (__super) {
        Constructor.__initializer = function(__parent){
            __super=__parent;
        };
        return Constructor;
        function Constructor() {
            __super.apply(this, arguments);
        }
    })();
    module.define('class', Constructor);
    module.export("Constructor", Constructor);
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
        Class.prototype.getMember = function (name, flags, descriptor) {
            if (flags === void 0) { flags = 0; }
            if (descriptor === void 0) { descriptor = false; }
            var isStatic = Modifier.has(flags, Modifier.STATIC);
            var key = "" + (isStatic ? '.' : ':') + name;
            var member = this.members[key];
            if (!member) {
                var scope = isStatic ? this.value : this.value.prototype;
                if (!!descriptor) {
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
                                member = new Method(this, name, flags, desc);
                            }
                            else {
                                member = new Property(this, name, flags, desc);
                            }
                        }
                    }
                    else {
                        if (typeof desc.value == 'function') {
                            if (name == 'constructor') {
                                member = new Constructor(this, name, flags, desc);
                            }
                            else {
                                member = new Method(this, name, flags, desc);
                            }
                        }
                        else {
                            member = new Property(this, name, flags, desc);
                        }
                    }
                    Object.defineProperty(this.members, key, {
                        enumerable: true,
                        value: member
                    });
                }
            }
            return member;
        };
        /**
         * @internal
         */
        Class.prototype.decorate = function (type, name, flags, designType, returnType, decorators, parameters, interfaces) {
            var _this = this;
            var name = name || "constructor";
            var decorateMember = function (member, type, params) {
                var decorator = type;
                if (typeof type == "function") {
                    decorator = new (type.bind.apply(type, [void 0].concat(params)))();
                }
                if (typeof decorator == 'function') {
                    if (member instanceof Constructor) {
                        var value = decorator(_this.value);
                        if (typeof value == 'function' && value !== _this.value) {
                            Object.defineProperty(_this, 'value', {
                                configurable: true,
                                value: value
                            });
                        }
                    }
                    else if (member instanceof Member) {
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
                    else if (member instanceof Parameter) {
                        decorator(member.owner.scope, member.owner.name, member.index);
                    }
                }
                else if (decorator instanceof decorators_1.Decorator) {
                    if (member instanceof Constructor) {
                        var value = decorator.decorate(member);
                        if (typeof value == 'function' && value !== _this.value) {
                            Object.defineProperty(_this, 'value', {
                                configurable: true,
                                value: value
                            });
                        }
                    }
                    else if (member instanceof Member) {
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
                else {
                    console.info(decorator);
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
                value: Type.get(designType)
            });
            if (member instanceof Method) {
                if (parameters && parameters.length) {
                    Object.defineProperty(member, 'parameters', {
                        enumerable: true,
                        writable: true,
                        configurable: true,
                        value: parameters.map(function (p, i) {
                            var decorators = p[3];
                            var parameter = new Parameter(member, p[0], i, p[1], Type.get(p[2]));
                            if (decorators && decorators.length) {
                                Object.defineProperty(parameter, 'decorators', {
                                    enumerable: true,
                                    writable: true,
                                    configurable: true,
                                    value: decorators
                                        .map(function (d) { return decorateMember(parameter, d.shift(), d); })
                                        .filter(function (d) { return (d instanceof decorators_1.Decorator); })
                                });
                            }
                            return parameter;
                        })
                    });
                }
                if (member instanceof Constructor) {
                    Object.defineProperty(member, 'returns', {
                        enumerable: true,
                        writable: true,
                        configurable: true,
                        value: Type.get(this.value)
                    });
                    if (interfaces && interfaces.length) {
                        Object.defineProperty(this, 'interfaces', {
                            enumerable: true,
                            writable: true,
                            configurable: true,
                            value: interfaces.map(function (i) { return Type.get(i); })
                        });
                    }
                }
                else {
                    Object.defineProperty(member, 'returns', {
                        enumerable: true,
                        writable: true,
                        configurable: true,
                        value: Type.get(returnType)
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
                        .filter(function (d) { return (d instanceof decorators_1.Decorator); })
                });
            }
            return this.value;
        };
        Class.prototype.toString = function () {
            return "Class(" + this.id + ")";
        };
        Class.__initializer = function(__parent){
            __super=__parent;
        };
        return Class;
        function Class(module, name, value) {
            var _this = this;
            __super.call(this, module, name);
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
            //delete this.value.name;
            //delete this.value.length;
            Object.getOwnPropertyNames(this.value).forEach(function (name) {
                if (name != 'arguments' && name != 'caller' && name != 'prototype' && name != '__decorator' && name != '__initializer') {
                    _this.getMember(name, Modifier.PUBLIC | Modifier.STATIC, true);
                }
            });
            Object.getOwnPropertyNames(this.value.prototype).forEach(function (name) {
                _this.getMember(name, Modifier.PUBLIC, true);
            });
            function getParents(target) {
                function getParent(target) {
                    if (target.__proto__) {
                        return target.__proto__.constructor;
                    }
                    else {
                        return null;
                    }
                }
                var parent = target, parents = [];
                while (parent && parent.prototype) {
                    if (parent = getParent(parent.prototype)) {
                        parents.push(parent);
                    }
                }
                return parents;
            }
        }
    })();
    module.define('class', Class);
    module.export("Class", Class);
    return {
        setters:[
            function (declaration_2_1) {
                declaration_2 = declaration_2_1;
            },
            function (decorators_1_1) {
                decorators_1 = decorators_1_1;
            }],
        execute: function() {
            Interface = module.init(Interface,declaration_2.Declaration);
            Type = module.init(Type);
            Modifier = module.init(Modifier);
            Parameter = module.init(Parameter,declaration_2.Declaration);
            Member = module.init(Member,declaration_2.Declaration);
            Property = module.init(Property,Member);
            Method = module.init(Method,Member);
            Constructor = module.init(Constructor,Method);
            Class = module.init(Class,Interface);
        }
    }
});
system.register("runtime/module", ["runtime/reflect/class", "runtime/helpers"], function(system,module) {
    var class_1, class_2, class_3, helpers_1;
    var REFLECT;
    var ModuleMap = module.define("interface","ModuleMap");
    var Module = (function (__super) {
        /**
         * @internal
         */
        Module.add = function (name, requires, definer) {
            return Object.defineProperty(system.modules, name, {
                writable: false,
                enumerable: true,
                configurable: false,
                value: new Module(name, requires, definer)
            })[name];
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
            value.__reflection = type;
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
                    this.members[value] = new class_2.Interface(this, value);
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
            var _this = this;
            var addClass = function (target, parent) {
                var Child, Parent;
                Object.defineProperty(_this.members, target.name, {
                    value: Object.defineProperty(target, 'class', {
                        value: Child = target[REFLECT] = new class_1.Class(_this, target.name, target)
                    }).class
                });
                class_1.Class.extend(target, parent);
                if (target.__initializer) {
                    target.__initializer(parent);
                    delete target.__initializer;
                }
                if (target.__decorator) {
                    var __decorator = target.__decorator;
                    delete target.__decorator;
                    __decorator(function (t, n, f, dt, rt, d, p, i) {
                        return Child.decorate(t, n, f, dt, rt, d, p, i);
                    }, class_3.Type.get);
                }
                return Child.value;
            };
            if (target.__reflection) {
                var type = target.__reflection;
                delete target.__reflection;
                if (type == 'class') {
                    //console.info("init class ",target.name);
                    return addClass(target, parent);
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
                }
                catch (ex) {
                    var error = new Error("module \"" + this.name + "\" execution error");
                    error.stack += "\ncause : \n" + ex.stack;
                    throw error;
                }
            }
        };
        return Module;
        /**
         * @internal
         */
        function Module(name, requires, definer) {
            this.name = name;
            this.requires = requires;
            this.members = Object.create(null);
            this.exports = Object.create(null);
            this.exports[REFLECT] = this;
            this.definer = definer(system, this);
        }
    })();
    module.define('class', Module);
    module.export("Module", Module);
    return {
        setters:[
            function (class_1_1) {
                class_1 = class_1_1;
                class_2 = class_1_1;
                class_3 = class_1_1;
            },
            function (helpers_1_1) {
                helpers_1 = helpers_1_1;
            }],
        execute: function() {
            REFLECT = Symbol('reflection');
            Module = module.init(Module);
        }
    }
});
system.register("runtime/loaders/base", ["runtime/helpers", "runtime/module"], function(system,module) {
    var helpers_2, module_1;
    var Loader = (function (__super) {
        Loader.prototype.import = function (name, parent) {
            if (system.modules[name]) {
                var m = system.modules[name];
                m.execute();
                return Promise.resolve(m.exports);
            }
            else {
                return this.doImport(name, parent || system.module).then(function (m) { return m.exports; });
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
                module_1.Module.get(name).execute();
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
            var url = helpers_2.Path.resolve(system.root, id + ".js");
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
                            return helpers_2.Path.resolve(helpers_2.Path.dirname(id), r);
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
                var sm = module_1.Module.add(name, m.requires, m.definer);
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
                    value: helpers_2.Path.resolve(helpers_2.Path.dirname(system.url), '..')
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
            function (helpers_2_1) {
                helpers_2 = helpers_2_1;
            },
            function (module_1_1) {
                module_1 = module_1_1;
            }],
        execute: function() {
            Loader = module.init(Loader);
        }
    }
});
system.register("runtime/loaders/node", ["runtime/loaders/base"], function(system,module) {
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
system.register("runtime/loaders/browser", ["runtime/loaders/base"], function(system,module) {
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
            __super.apply(this, arguments);
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
system.register("runtime/loader", ["runtime/loaders/base", "runtime/loaders/node", "runtime/loaders/browser"], function(system,module) {
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
system.register("runtime/system", ["runtime/events", "runtime/module", "runtime/loader", "runtime/reflect/class"], function(system,module) {
    var events_2, module_2, loader_1, loader_2, loader_3, class_4;
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
        System.__initializer = function(__parent){
            __super=__parent;
        };
        return System;
        /**
         * @internal
         */
        function System(process) {
            __super.call(this);
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
                        m.init(m.members[i], null);
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
            this.emit('init');
            if (this.promises && this.promises.length) {
                var promise;
                while (promise = this.promises.shift()) {
                    promise.accept();
                }
                delete this.promises;
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
            function (module_2_1) {
                module_2 = module_2_1;
            },
            function (loader_1_1) {
                loader_1 = loader_1_1;
                loader_2 = loader_1_1;
                loader_3 = loader_1_1;
            },
            function (class_4_1) {
                class_4 = class_4_1;
            }],
        execute: function() {
            System = module.init(System,events_2.Emitter);
            module.export("default",system);
        }
    }
});
//# sourceMappingURL=package.js.map