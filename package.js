var Runtime;
(function (Runtime) {
    var Path = (function () {
        function Path() {
        }
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
        Path.SEP = '/';
        return Path;
    })();
    Runtime.Path = Path;
})(Runtime || (Runtime = {}));
var Reflect;
(function (Reflect) {
    (function (Scope) {
        Scope[Scope["STATIC"] = 0] = "STATIC";
        Scope[Scope["INSTANCE"] = 1] = "INSTANCE";
    })(Reflect.Scope || (Reflect.Scope = {}));
    var Scope = Reflect.Scope;
    (function (ModuleState) {
        ModuleState[ModuleState["CREATED"] = 0] = "CREATED";
        ModuleState[ModuleState["LOADING"] = 1] = "LOADING";
        ModuleState[ModuleState["EVALUATING"] = 2] = "EVALUATING";
        ModuleState[ModuleState["DEFINING"] = 3] = "DEFINING";
        ModuleState[ModuleState["EXECUTING"] = 4] = "EXECUTING";
        ModuleState[ModuleState["DONE"] = 5] = "DONE";
        ModuleState[ModuleState["FAILED"] = 6] = "FAILED";
    })(Reflect.ModuleState || (Reflect.ModuleState = {}));
    var ModuleState = Reflect.ModuleState;
})(Reflect || (Reflect = {}));
var Reflect;
(function (Reflect) {
    Reflect.METADATA = Symbol('metadata');
    var Definition = (function () {
        function Definition(name) {
            this.name = name;
            this.metadata = Object.create(null);
        }
        Definition.for = function (target, key, index) {
            var scope, closure;
            switch (typeof target) {
                case "function":
                    closure = target;
                    scope = Reflect.Scope.STATIC;
                    break;
                case "object":
                    closure = target.constructor;
                    scope = Reflect.Scope.INSTANCE;
                    break;
            }
            var cls = closure[Reflect.METADATA];
            if (cls && key) {
                var member = cls.get(scope, key);
                if (member && typeof index == "number" && (member instanceof Reflect.Method)) {
                    return member.params[index];
                }
                else {
                    return member;
                }
            }
            else {
                if (typeof index == "number") {
                    return cls.params[index];
                }
                else {
                    return cls;
                }
            }
        };
        Definition.prototype.getMetadata = function (key) {
            return this.metadata[Symbol.for(key)];
        };
        Definition.prototype.hasMetadata = function (key) {
            return this.getMetadataKeys().indexOf(key) >= 0;
        };
        Definition.prototype.getMetadataKeys = function () {
            return Object.getOwnPropertySymbols(this.metadata).map(function (k) { return Symbol.keyFor(k); });
        };
        Definition.prototype.setMetadata = function (key, value) {
            this.metadata[Symbol.for(key)] = value;
        };
        Definition.prototype.deleteMetadata = function (key) {
            delete this.metadata[Symbol.for(key)];
        };
        Definition.prototype.toJSON = function () {
            var any = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                any[_i - 0] = arguments[_i];
            }
            return {
                name: this.name,
                parent: this.constructor.name
            };
        };
        return Definition;
    })();
    Reflect.Definition = Definition;
})(Reflect || (Reflect = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Reflect;
(function (Reflect) {
    var Member = (function (_super) {
        __extends(Member, _super);
        function Member(name, owner, scope) {
            _super.call(this, name);
            this.owner = owner;
            this.scope = scope;
            this.name = name;
        }
        Member.prototype.toJSON = function () {
            return {
                name: this.name,
                kind: this.constructor.name,
                owner: this.owner.name,
                scope: this.scope,
                type: this.type ? this.type.name : undefined
            };
        };
        return Member;
    })(Reflect.Definition);
    Reflect.Member = Member;
    var Param = (function (_super) {
        __extends(Param, _super);
        function Param(name, owner, type) {
            _super.call(this, name);
            this.owner = owner;
            this.type = type;
        }
        Param.prototype.toJSON = function () {
            var any = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                any[_i - 0] = arguments[_i];
            }
            return {
                name: this.name,
                owner: this.owner.name,
                type: this.type ? this.type.name : undefined
            };
        };
        return Param;
    })(Reflect.Definition);
    Reflect.Param = Param;
    var Method = (function (_super) {
        __extends(Method, _super);
        function Method() {
            _super.apply(this, arguments);
        }
        Method.prototype.toJSON = function () {
            var _this = this;
            var any = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                any[_i - 0] = arguments[_i];
            }
            return {
                name: this.name,
                kind: this.constructor.name,
                owner: this.owner.name,
                scope: this.scope,
                type: this.type ? this.type.name : undefined,
                returnType: this.returnType ? this.returnType.name : undefined,
                params: (function () {
                    if (_this.params && _this.params.length) {
                        var map = Object.create(null), count = 0;
                        Object.keys(_this.params).forEach(function (m) {
                            map[m] = _this.params[m].toJSON();
                            count++;
                        });
                        return count > 0 ? map : undefined;
                    }
                })()
            };
        };
        return Method;
    })(Member);
    Reflect.Method = Method;
    var Field = (function (_super) {
        __extends(Field, _super);
        function Field() {
            _super.apply(this, arguments);
        }
        return Field;
    })(Member);
    Reflect.Field = Field;
    var Accessor = (function (_super) {
        __extends(Accessor, _super);
        function Accessor() {
            _super.apply(this, arguments);
        }
        return Accessor;
    })(Field);
    Reflect.Accessor = Accessor;
})(Reflect || (Reflect = {}));
var Reflect;
(function (Reflect) {
    var Class = (function (_super) {
        __extends(Class, _super);
        function Class(module, constructor) {
            _super.call(this, constructor.name);
            this.owner = module;
            this.static = {};
            this.instance = {};
            this.constructor = constructor;
            this.owner.add(this);
        }
        Class.prototype.get = function (scope, name) {
            switch (scope) {
                case Reflect.Scope.STATIC:
                    if (this.static[name]) {
                        return this.static[name];
                    }
                    break;
                case Reflect.Scope.INSTANCE:
                    if (this.instance[name]) {
                        return this.instance[name];
                    }
                    break;
            }
        };
        Class.prototype.members = function (filter) {
            var _this = this;
            var result = [];
            Object.keys(this.static).forEach(function (k) {
                var member = _this.static[k];
                if (!filter || filter(member)) {
                    result.push(member);
                }
            });
            Object.keys(this.instance).forEach(function (k) {
                var member = _this.instance[k];
                if (!filter || filter(member)) {
                    result.push(member);
                }
            });
            return result;
        };
        Class.prototype.add = function (member) {
            switch (member.scope) {
                case Reflect.Scope.STATIC:
                    this.static[member.name] = member;
                    break;
                case Reflect.Scope.INSTANCE:
                    this.instance[member.name] = member;
                    break;
            }
        };
        Class.prototype.toJSON = function () {
            var _this = this;
            var any = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                any[_i - 0] = arguments[_i];
            }
            return {
                name: this.name,
                parent: this.parent ? this.parent.name : undefined,
                children: (function () {
                    return _this.children
                        ? _this.children.map(function (c) { return c.name; })
                        : undefined;
                })(),
                params: (function () {
                    if (_this.params && _this.params.length) {
                        var map = Object.create(null), count = 0;
                        Object.keys(_this.params).forEach(function (m) {
                            map[m] = _this.params[m].toJSON();
                            count++;
                        });
                        return count > 0 ? map : undefined;
                    }
                })(),
                members: (function () {
                    var map = Object.create(null), count = 0;
                    Object.keys(_this.static).forEach(function (m) {
                        map[("." + m)] = _this.static[m].toJSON();
                        count++;
                    });
                    Object.keys(_this.instance).forEach(function (m) {
                        map[("#" + m)] = _this.instance[m].toJSON();
                        count++;
                    });
                    return count > 0 ? map : undefined;
                })()
            };
        };
        return Class;
    })(Reflect.Definition);
    Reflect.Class = Class;
})(Reflect || (Reflect = {}));
var Reflect;
(function (Reflect) {
    Reflect.MODULES = Object.create(null);
    var Module = (function (_super) {
        __extends(Module, _super);
        function Module(data) {
            _super.call(this, data.name);
            if (!Reflect.MODULES[this.name]) {
                Reflect.MODULES[this.name] = this;
                this.url = data.url;
                this.main = data.main || false;
                this.source = data.source;
                this.exports = data.exports;
                this.dependencies = data.dependencies || [];
                this.dependants = data.dependants || [];
                this.classes = Object.create(null);
            }
            else {
                throw new Error("Duplicate module definition with name '" + this.name + "'");
            }
        }
        Module.all = function () {
            var _this = this;
            return Object.keys(Reflect.MODULES).map(function (name) { return _this.get(name); });
        };
        Module.has = function (name) {
            return !!this.get(name);
        };
        Module.get = function (name) {
            return Reflect.MODULES[name];
        };
        Object.defineProperty(Module.prototype, "project", {
            get: function () {
                return this.name.split('/')[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Module.prototype, "path", {
            get: function () {
                return this.name.substr(this.project.length + 1);
            },
            enumerable: true,
            configurable: true
        });
        Module.prototype.add = function (cls) {
            this.classes[cls.name] = cls;
        };
        Module.prototype.setClass = function (clazz) {
            this.classes[clazz.name] = clazz;
        };
        Module.prototype.getClass = function (name) {
            return this.classes[name];
        };
        Module.prototype.toJSON = function () {
            var _this = this;
            var any = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                any[_i - 0] = arguments[_i];
            }
            return {
                name: this.name,
                url: this.url,
                main: this.main,
                source: this.source,
                state: Reflect.ModuleState[this.state],
                dependencies: this.dependencies,
                dependants: this.dependants,
                exports: (function () {
                    if (_this.exports) {
                        return Object.keys(_this.exports);
                    }
                })(),
                classes: (function () {
                    var map = Object.create(null), count = 0;
                    Object.keys(_this.classes).forEach(function (c) {
                        map[c] = _this.classes[c].toJSON();
                        count++;
                    });
                    return count > 0 ? map : undefined;
                })()
            };
        };
        return Module;
    })(Reflect.Definition);
    Reflect.Module = Module;
})(Reflect || (Reflect = {}));
///<reference path="./reflect/enums.ts"/>
///<reference path="./reflect/definition.ts"/>
///<reference path="./reflect/member.ts"/>
///<reference path="./reflect/class.ts"/>
///<reference path="./reflect/module.ts"/>
var Reflect;
(function (Reflect) {
    function metadata(metadataKey, metadataValue) {
        return function (target, targetKey) { return defineMetadata(metadataKey, metadataValue, target, targetKey); };
    }
    Reflect.metadata = metadata;
    function defineMetadata(metadataKey, metadataValue, target, targetKey) {
        Reflect.Definition.for(target, targetKey).setMetadata(metadataKey, metadataValue);
    }
    Reflect.defineMetadata = defineMetadata;
    function hasMetadata(metadataKey, target, targetKey) {
        var cls = Reflect.Definition.for(target);
        while (cls) {
            var def = Reflect.Definition.for(cls.constructor, targetKey);
            if (def && def.hasMetadata(metadataKey)) {
                return true;
            }
            else {
                cls = cls.parent;
            }
        }
        return false;
    }
    Reflect.hasMetadata = hasMetadata;
    function hasOwnMetadata(metadataKey, target, targetKey) {
        var def = Reflect.Definition.for(target, targetKey);
        if (def) {
            return def.hasMetadata(metadataKey);
        }
        else {
            return false;
        }
    }
    Reflect.hasOwnMetadata = hasOwnMetadata;
    function getMetadata(metadataKey, target, targetKey) {
        var cls = Reflect.Definition.for(target);
        while (cls) {
            var def = Reflect.Definition.for(cls.constructor, targetKey);
            if (def && def.hasMetadata(metadataKey)) {
                return def.getMetadata(metadataKey);
            }
            else {
                cls = cls.parent;
            }
        }
        return null;
    }
    Reflect.getMetadata = getMetadata;
    function getOwnMetadata(metadataKey, target, targetKey) {
        var def = Reflect.Definition.for(target, targetKey);
        if (def && def.hasMetadata(metadataKey)) {
            return def.getMetadata(metadataKey);
        }
        else {
            return null;
        }
    }
    Reflect.getOwnMetadata = getOwnMetadata;
    function getMetadataKeys(target, targetKey) {
        var cls = Reflect.Definition.for(target);
        var keys;
        while (cls) {
            var def = Reflect.Definition.for(cls.constructor, targetKey);
            if (def) {
                return keys = keys.concat(def.getMetadataKeys());
            }
            else {
                cls = cls.parent;
            }
        }
        return keys;
    }
    Reflect.getMetadataKeys = getMetadataKeys;
    function getOwnMetadataKeys(target, targetKey) {
        var def = Reflect.Definition.for(target, targetKey);
        if (def) {
            return def.getMetadataKeys();
        }
        else {
            return [];
        }
    }
    Reflect.getOwnMetadataKeys = getOwnMetadataKeys;
    function deleteMetadata(metadataKey, target, targetKey) {
        var def = Reflect.Definition.for(target, targetKey);
        if (def && def.hasMetadata(metadataKey)) {
            def.deleteMetadata(metadataKey);
            return true;
        }
        else {
            return false;
        }
    }
    Reflect.deleteMetadata = deleteMetadata;
})(Reflect || (Reflect = {}));
var Runtime;
(function (Runtime) {
    var ModuleState = Reflect.ModuleState;
    var Class = Reflect.Class;
    var Scope = Reflect.Scope;
    var METADATA = Reflect.METADATA;
    var Method = Reflect.Method;
    var Accessor = Reflect.Accessor;
    var Field = Reflect.Field;
    var Param = Reflect.Param;
    var ModuleDecorator = (function () {
        function ModuleDecorator(module) {
            this.module = module;
            this.__metadata = this.__metadata.bind(this);
            this.__decorate = this.__decorate.bind(this);
            this.__extends = this.__extends.bind(this);
            this.__param = this.__param.bind(this);
        }
        ModuleDecorator.prototype.__decorate = function (decorators, target, key, desc) {
            var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
            for (var i = decorators.length - 1; i >= 0; i--)
                if (d = decorators[i])
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            if (c > 3 && r) {
                Object.defineProperty(target, key, r);
            }
            this.__define(target, key);
            return r;
        };
        ModuleDecorator.prototype.__metadata = function (k, v) {
            var _this = this;
            return function (target, key, desc) {
                var def = _this.__define(target, key);
                switch (k) {
                    case 'design:returntype':
                        def.returnType = v;
                        break;
                    case 'design:paramtypes':
                        try {
                            var paramTypes = v;
                            var closureStr = String((desc && desc.value) || target).match(/function\s*[a-z0-9$_,\s]*\(([a-z0-9$_,\s]*)\)/i);
                            if (closureStr) {
                                closureStr = closureStr[1].trim().split(/\s*\,\s*/);
                            }
                            var paramNames = closureStr;
                            var params = [];
                            for (var i = 0; i < paramTypes.length; i++) {
                                params[i] = new Param(paramNames[i], def, paramTypes[i]);
                            }
                            def.params = params;
                        }
                        catch (e) {
                            console.info(e);
                        }
                        break;
                    case 'design:type':
                        def.type = v;
                        break;
                }
            };
        };
        ModuleDecorator.prototype.__param = function (paramIndex, decorator) {
            return function (target, key) {
                decorator(target, key, paramIndex);
            };
        };
        ModuleDecorator.prototype.__extends = function (d, b) {
            var dd = this.__define(d);
            var bb = this.__define(b);
            dd.parent = bb;
            if (!bb.children) {
                bb.children = [dd];
            }
            else {
                bb.children.push(dd);
            }
            for (var p in b)
                if (b.hasOwnProperty(p))
                    d[p] = b[p];
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
        ModuleDecorator.prototype.__define = function (target, key, desc) {
            var scope, closure;
            switch (typeof target) {
                case "function":
                    closure = target;
                    scope = Scope.STATIC;
                    break;
                case "object":
                    closure = target.constructor;
                    scope = Scope.INSTANCE;
                    break;
            }
            var cls = closure[METADATA];
            if (!cls) {
                cls = closure[METADATA]
                    = this.module.classes[closure.name]
                        = new Class(this.module, closure);
            }
            if (key) {
                var member = cls.get(scope, key);
                if (!member) {
                    var descriptor = desc || Object.getOwnPropertyDescriptor(target, key) || {
                        enumerable: true,
                        configurable: true,
                        writable: true,
                        value: null
                    };
                    if (typeof descriptor.value == 'function') {
                        member = new Method(key, cls, scope);
                    }
                    else if (descriptor.get || descriptor.set) {
                        member = new Accessor(key, cls, scope);
                    }
                    else {
                        member = new Field(key, cls, scope);
                    }
                    cls.add(member);
                }
                return member;
            }
            else {
                return cls;
            }
        };
        return ModuleDecorator;
    })();
    Runtime.ModuleDecorator = ModuleDecorator;
    var Module = (function (_super) {
        __extends(Module, _super);
        function Module() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(Module.prototype, "isDefined", {
            get: function () {
                return !!this.exports;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Module.prototype, "isEvaluated", {
            get: function () {
                return this.isDefined || !!this.executor;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Module.prototype, "isLoaded", {
            get: function () {
                return this.isEvaluated || !!this.source;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Module.prototype, "isExecuted", {
            get: function () {
                return this.isDefined && (!this.definer || !this.definer.execute);
            },
            enumerable: true,
            configurable: true
        });
        Module.prototype.define = function () {
            var _this = this;
            if (this.executor) {
                this.exports = Object.create(null);
                var decorator = new ModuleDecorator(this);
                var executor = this.executor.bind(decorator);
                delete this.executor;
                this.definer = executor(function (key, value) {
                    _this.exports[key] = value;
                });
            }
        };
        Module.prototype.register = function (requires, executor) {
            var _this = this;
            this.executor = executor;
            this.dependencies = requires.map(function (d) {
                var path = d;
                if (path[0] == '.') {
                    path = Runtime.Path.resolve(Runtime.Path.dirname(_this.name), path);
                }
                return path;
            });
        };
        Module.prototype.inject = function (module, index) {
            if (module.dependants.indexOf(this.name) < 0) {
                module.dependants.push(this.name);
            }
            this.definer.setters[index](module.exports);
            this.definer.setters[index] = true;
            return module;
        };
        Module.prototype.execute = function (clean) {
            if (clean === void 0) { clean = true; }
            if (this.definer && this.definer.execute) {
                this.definer.execute();
            }
            delete this.definer;
            return this;
        };
        Module.prototype.done = function (error) {
            if (!error) {
                this.state = ModuleState.DONE;
                return this;
            }
            else {
                this.state = ModuleState.FAILED;
                this.error = error;
                throw error;
            }
        };
        return Module;
    })(Reflect.Module);
    Runtime.Module = Module;
    var Loader = (function () {
        function Loader() {
            this.load = this.load.bind(this);
            this.define = this.define.bind(this);
            this.eval = this.eval.bind(this);
            this.execute = this.execute.bind(this);
        }
        Object.defineProperty(Loader, "global", {
            get: function () {
                var _this = this;
                return Object.defineProperty(this, 'global', {
                    value: (function () {
                        switch (_this.platform) {
                            case 'browser': return window;
                            case 'node': return global;
                        }
                    })()
                }).global;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Loader, "platform", {
            get: function () {
                return Object.defineProperty(this, 'platform', {
                    value: (function () {
                        if (typeof window != 'undefined') {
                            return 'browser';
                        }
                        else if (typeof process == 'object') {
                            return 'node';
                        }
                    })()
                }).platform;
            },
            enumerable: true,
            configurable: true
        });
        Loader.prototype.import = function (uri) {
            var _this = this;
            return this.module(uri).then(function (m) { return (_this.main = _this.main ? _this.main : (m.main = true, m), m.exports); });
        };
        Loader.prototype.module = function (id) {
            var module = this.get(id);
            var promise = Promise.resolve(module);
            promise = promise.then(this.load);
            promise = promise.then(this.eval);
            promise = promise.then(this.define);
            promise = promise.then(this.execute);
            return promise.then(function (m) { return (module.done()); }, function (e) { return (module.done(e)); });
        };
        Loader.prototype.register = function (requires, executor) {
            this.current.register(requires, executor);
        };
        Loader.prototype.bundle = function (content) {
            for (var id in content) {
                var name = Runtime.Path.moduleId(this.root, id);
                var url = Runtime.Path.moduleUrl(this.root, id);
                new Module({
                    name: name,
                    url: url,
                    main: false,
                    source: content[name]
                });
            }
        };
        Object.defineProperty(Loader.prototype, "root", {
            get: function () {
                return Object.defineProperty(this, 'root', {
                    value: Runtime.Path.resolve(Runtime.Path.dirname(this.runtime), '..')
                }).root;
            },
            enumerable: true,
            configurable: true
        });
        Loader.prototype.get = function (id) {
            var name = Runtime.Path.moduleId(this.root, id);
            var url = Runtime.Path.moduleUrl(this.root, id);
            var module = Module.get(name);
            if (!module) {
                module = new Module({ name: name, url: url });
            }
            return module;
        };
        Loader.prototype.eval = function (module) {
            return Promise.resolve(module);
        };
        Loader.prototype.load = function (module) {
            return Promise.resolve(module);
        };
        Loader.prototype.execute = function (module) {
            var _this = this;
            if (module.state != ModuleState.EXECUTING) {
                module.state = ModuleState.EXECUTING;
                module.dependencies.forEach(function (d) {
                    _this.execute(_this.get(d));
                });
                module.execute();
            }
            return module;
        };
        Loader.prototype.define = function (module) {
            var _this = this;
            if (module.isDefined) {
                return Promise.resolve(module);
            }
            else {
                module.state = ModuleState.DEFINING;
                module.define();
                if (module.dependencies.length) {
                    var requires = module.dependencies.map(function (r, i) {
                        var promise = Promise.resolve(_this.get(r));
                        promise = promise.then(_this.load);
                        promise = promise.then(_this.eval);
                        promise = promise.then(_this.define);
                        return promise.then(function (m) {
                            return module.inject(m, i);
                        });
                    });
                    return Promise.all(requires).then(function (r) {
                        return Promise.resolve(module);
                    });
                }
                else {
                    return Promise.resolve(module);
                }
            }
        };
        return Loader;
    })();
    Runtime.Loader = Loader;
})(Runtime || (Runtime = {}));
///<reference path="./loader.ts"/>
var Runtime;
(function (Runtime) {
    var ModuleState = Reflect.ModuleState;
    var BrowserLoader = (function (_super) {
        __extends(BrowserLoader, _super);
        function BrowserLoader() {
            _super.apply(this, arguments);
        }
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
        BrowserLoader.prototype.eval = function (module) {
            var _this = this;
            if (module.isEvaluated) {
                return Promise.resolve(module);
            }
            else {
                return new Promise(function (accept, reject) {
                    module.state = ModuleState.EVALUATING;
                    _this.current = module;
                    var aHead = window.document.querySelector('head');
                    var aScript = window.document.createElement('script');
                    aScript.type = 'text/javascript';
                    aScript.id = module.name;
                    aScript.text = module.source + '\n//# sourceURL=' + module.url;
                    aHead.appendChild(aScript);
                    if (_this.current.isEvaluated) {
                        _this.current = null;
                        accept(module);
                    }
                    else {
                        reject(new Error("Evaluation failed in " + module.url));
                    }
                });
            }
        };
        BrowserLoader.prototype.load = function (module) {
            if (module.isLoaded) {
                return Promise.resolve(module);
            }
            else {
                var promise = module['loader'];
                if (!promise) {
                    module.state = ModuleState.LOADING;
                    promise = module['loader'] = new Promise(function (accept, reject) {
                        var oReq = new window.XMLHttpRequest();
                        oReq.addEventListener('load', function (e) {
                            module.source = oReq.responseText;
                            delete module['loader'];
                            accept(module);
                        });
                        oReq.addEventListener("error", function (e) {
                            module.source = String(e.stack || e);
                            delete module['loader'];
                            reject(e);
                        });
                        oReq.open("get", module.url, true);
                        oReq.send();
                    });
                }
                return promise;
            }
        };
        return BrowserLoader;
    })(Runtime.Loader);
    Runtime.BrowserLoader = BrowserLoader;
})(Runtime || (Runtime = {}));
///<reference path="./loader.ts"/>
var Runtime;
(function (Runtime) {
    var ModuleState = Reflect.ModuleState;
    var NodeLoader = (function (_super) {
        __extends(NodeLoader, _super);
        function NodeLoader() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(NodeLoader, "fs", {
            get: function () {
                return Object.defineProperty(this, 'fs', {
                    value: require('fs')
                }).fs;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NodeLoader, "vm", {
            get: function () {
                return Object.defineProperty(this, 'vm', {
                    value: require('vm')
                }).vm;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(NodeLoader.prototype, "context", {
            get: function () {
                var _this = this;
                return Object.defineProperty(this, 'context', {
                    value: (function () {
                        //console.info(Object.keys(global));
                        var context = {};
                        for (var name in global) {
                            context[name] = global[name];
                        }
                        context.require = require;
                        context.System = System;
                        context.Reflect = Reflect;
                        context.Runtime = Runtime;
                        context.__filename = _this.current.url;
                        context.__dirname = Runtime.Path.dirname(_this.current.url);
                        return context;
                    })()
                }).context;
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
        NodeLoader.prototype.eval = function (module) {
            var _this = this;
            if (module.isEvaluated) {
                return Promise.resolve(module);
            }
            else {
                return new Promise(function (accept, reject) {
                    module.state = ModuleState.EVALUATING;
                    _this.current = module;
                    NodeLoader.vm.runInNewContext(module.source, _this.context, {
                        filename: module.url
                    });
                    if (_this.current.isEvaluated) {
                        _this.current = null;
                        accept(module);
                    }
                    else {
                        reject(new Error("Evaluation failed in " + module.url));
                    }
                });
            }
        };
        NodeLoader.prototype.load = function (module) {
            if (module.isLoaded) {
                return Promise.resolve(module);
            }
            else {
                var promise = module['loader'];
                if (!promise) {
                    module.state = ModuleState.LOADING;
                    promise = module['loader'] = new Promise(function (accept, reject) {
                        if (module.project == 'node') {
                            module.source = "System.register([], function(exports) {\n                                var exported = require('" + module.path + "');\n                                for(var name in exported){\n                                    exports(name,exported[name])\n                                }\n                                exports('default',exported)\n                            })";
                            accept(module);
                        }
                        else {
                            NodeLoader.fs.readFile(module.url, 'utf8', function (err, data) {
                                if (err) {
                                    module.source = String(err.stack || err);
                                    reject(err);
                                }
                                else {
                                    module.source = data;
                                    accept(module);
                                }
                            });
                        }
                    });
                }
                return promise;
            }
        };
        return NodeLoader;
    })(Runtime.Loader);
    Runtime.NodeLoader = NodeLoader;
})(Runtime || (Runtime = {}));
///<reference path="./helpers.ts"/>
///<reference path="./reflect.ts"/>
///<reference path="./runtime/loader.ts"/>
///<reference path="./runtime/browser.ts"/>
///<reference path="./runtime/node.ts"/>
var System = (function () {
    function System() {
        if (!Runtime.Loader.global.System) {
            Runtime.Loader.global.System = System;
        }
        return System;
    }
    Object.defineProperty(System, "platform", {
        get: function () {
            return Runtime.Loader.platform;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(System, "loader", {
        get: function () {
            return Object.defineProperty(this, 'loader', {
                value: (function () {
                    switch (System.platform) {
                        case 'browser': return new Runtime.BrowserLoader();
                        case 'node': return new Runtime.NodeLoader();
                    }
                })()
            }).loader;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(System, "modules", {
        get: function () {
            return Reflect.MODULES;
        },
        enumerable: true,
        configurable: true
    });
    System.module = function (uri) {
        return this.loader.module(uri);
    };
    System.import = function (uri) {
        return this.loader.import(uri);
    };
    System.register = function (requires, execute) {
        this.loader.register(requires, execute);
    };
    System.bundle = function (content) {
        this.loader.bundle(content);
    };
    return System;
})();
new System();
//# sourceMappingURL=package.js.map