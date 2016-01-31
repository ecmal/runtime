var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Ecmal;
(function (Ecmal) {
    var Loader = (function () {
        function Loader() {
            this.options = {};
            this.modules = {};
            this.cache = {};
        }
        Object.defineProperty(Loader.prototype, "base", {
            get: function () {
                if (!this.options.base) {
                    this.options.base = Ecmal.Path.resolve(Ecmal.Path.dirname(this.runtime), '../');
                }
                return this.options.base;
            },
            set: function (v) {
                this.options.base = v;
            },
            enumerable: true,
            configurable: true
        });
        Loader.prototype.bundle = function (contents) {
            for (var i in contents) {
                this.cache[i.toLowerCase()] = contents[i];
            }
        };
        Loader.prototype.get = function (url) {
            var id = url.replace(this.base + '/', '').replace(/^(.*)\.js$/g, '$1').toLowerCase();
            var module = this.modules[id];
            if (!module) {
                module = this.modules[id] = { id: id, url: url };
            }
            return module;
        };
        Loader.prototype.register = function (name, dependencies, executable) {
            this.current.dependencies = dependencies;
            this.current.executable = executable;
        };
        Loader.prototype.import = function (name) {
            var _this = this;
            var url = Ecmal.Path.resolve(this.base, name + '.js');
            var dir = Ecmal.Path.dirname(url);
            var mod = this.get(url);
            if (mod.exports) {
                return Promise.resolve(mod.exports);
            }
            else {
                return this.fetch(mod).then(function (m) { return _this.define(m); }).then(function (m) { return m.exports; });
            }
        };
        Loader.prototype.fetch = function (module) {
            var _this = this;
            var promise = Promise.resolve(module);
            if (typeof module.source == 'undefined' && !module.defined) {
                module.source = '';
                promise = this.read(module)
                    .then(function () { return _this.eval(module); })
                    .then(function () {
                    var dir = Ecmal.Path.dirname(module.url);
                    var dependencies = module.dependencies.map(function (d) {
                        var path = d + '.js';
                        if (path[0] == '.') {
                            path = Ecmal.Path.resolve(dir, path);
                        }
                        else {
                            path = Ecmal.Path.resolve(_this.base, path);
                        }
                        return _this.fetch(_this.get(path));
                    });
                    return Promise.all(dependencies).then(function (modules) {
                        for (var d = 0; d < modules.length; d++) {
                            module.dependencies[d] = modules[d];
                            modules[d].parent = module;
                        }
                        return module;
                    });
                });
            }
            return promise;
        };
        Loader.prototype.define = function (module) {
            var _this = this;
            if (module.defined) {
                return Promise.resolve(module);
            }
            else {
                module.defined = true;
                module.exports = {};
                var definer = new module.executable(function (name, val) {
                    module.exports[name] = val;
                });
                if (module.dependencies.length) {
                    var promises = module.dependencies.map(function (m) { return _this.define(m).then(function (m) { return m.exports; }); });
                    return Promise.all(promises).then(function (exps) {
                        for (var i = 0; i < exps.length; i++) {
                            definer.setters[i](exps[i]);
                        }
                        definer.execute();
                        return module;
                    });
                }
                else {
                    definer.execute();
                    return Promise.resolve(module);
                }
            }
        };
        return Loader;
    })();
    Ecmal.Loader = Loader;
    var ServerSideLoader = (function (_super) {
        __extends(ServerSideLoader, _super);
        function ServerSideLoader() {
            _super.call(this);
        }
        Object.defineProperty(ServerSideLoader, "FS", {
            get: function () {
                return Object.defineProperty(this, 'FS', {
                    value: require('fs')
                }).FS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSideLoader, "VM", {
            get: function () {
                return Object.defineProperty(this, 'VM', {
                    value: require('vm')
                }).VM;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSideLoader.prototype, "runtime", {
            get: function () {
                return __filename;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ServerSideLoader.prototype, "main", {
            get: function () {
                return process.argv[2];
            },
            enumerable: true,
            configurable: true
        });
        ServerSideLoader.prototype.get = function (name) {
            var mod = _super.prototype.get.call(this, name);
            if (mod.id.indexOf('node/') == 0) {
                mod.defined = true;
                mod.exports = require(mod.id.substring(5));
                return mod;
            }
            else {
                return mod;
            }
        };
        ServerSideLoader.prototype.read = function (module) {
            if (this.cache[module.id]) {
                module.source = this.cache[module.id];
                return Promise.resolve(module);
            }
            else {
                return new Promise(function (accept, reject) {
                    ServerSideLoader.FS.readFile(module.url, 'utf8', function (err, data) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            module.source = data;
                            accept(module);
                        }
                    });
                });
            }
        };
        ServerSideLoader.prototype.eval = function (module) {
            this.current = module;
            var context = {
                System: global['System'],
                Buffer: global['Buffer'],
                require: global['require'],
                process: global['process'],
                console: global['console'],
                __filename: module.url,
                __dirname: Ecmal.Path.dirname(module.url)
            };
            ServerSideLoader.VM.runInNewContext(module.source, context, {
                filename: module.url
            });
            this.current = null;
            return Promise.resolve(module);
        };
        return ServerSideLoader;
    })(Loader);
    Ecmal.ServerSideLoader = ServerSideLoader;
    var ClientSideLoader = (function (_super) {
        __extends(ClientSideLoader, _super);
        function ClientSideLoader() {
            _super.apply(this, arguments);
        }
        Object.defineProperty(ClientSideLoader.prototype, "script", {
            get: function () {
                return document.querySelector('script[main]');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClientSideLoader.prototype, "runtime", {
            get: function () {
                return this.script.src;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClientSideLoader.prototype, "main", {
            get: function () {
                return this.script.getAttribute('main');
            },
            enumerable: true,
            configurable: true
        });
        ClientSideLoader.prototype.read = function (module) {
            if (this.cache[module.id]) {
                module.source = this.cache[module.id];
                return Promise.resolve(module);
            }
            else {
                return new Promise(function (accept, reject) {
                    var oReq = new XMLHttpRequest();
                    oReq.addEventListener('load', function (e) {
                        module.source = oReq.responseText;
                        accept(module);
                    });
                    oReq.addEventListener("error", function (e) {
                        reject(e);
                    });
                    oReq.open("get", module.url, true);
                    oReq.send();
                });
            }
        };
        ClientSideLoader.prototype.eval = function (module) {
            this.current = module;
            var aHead = document.querySelector('head');
            var aScript = document.createElement('script');
            aScript.type = 'text/javascript';
            aScript.id = module.id;
            aScript.text = module.source + '\n//# sourceURL=' + module.url;
            aHead.appendChild(aScript);
            this.current = null;
            return Promise.resolve(module);
        };
        return ClientSideLoader;
    })(Loader);
    Ecmal.ClientSideLoader = ClientSideLoader;
})(Ecmal || (Ecmal = {}));
var Ecmal;
(function (Ecmal) {
    (function (Environment) {
        Environment[Environment["SERVER"] = 0] = "SERVER";
        Environment[Environment["CLIENT"] = 1] = "CLIENT";
    })(Ecmal.Environment || (Ecmal.Environment = {}));
    var Environment = Ecmal.Environment;
    function platform() {
        var support = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            support[_i - 0] = arguments[_i];
        }
        return function (target) {
            target.support = support;
        };
    }
    Ecmal.platform = platform;
})(Ecmal || (Ecmal = {}));
var Ecmal;
(function (Ecmal) {
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
        Path.SEP = '/';
        return Path;
    })();
    Ecmal.Path = Path;
})(Ecmal || (Ecmal = {}));
var Ecmal;
(function (Ecmal) {
    var Runtime = (function () {
        function Runtime() {
        }
        Object.defineProperty(Runtime, "environment", {
            get: function () {
                if (typeof window != 'undefined') {
                    return Ecmal.Environment.CLIENT;
                }
                else if (typeof process == 'object') {
                    return Ecmal.Environment.SERVER;
                }
            },
            enumerable: true,
            configurable: true
        });
        return Runtime;
    })();
    Ecmal.Runtime = Runtime;
    var System = (function () {
        function System() {
            switch (Runtime.environment) {
                case Ecmal.Environment.SERVER:
                    this.loader = new Ecmal.ServerSideLoader();
                    break;
                case Ecmal.Environment.CLIENT:
                    this.loader = new Ecmal.ClientSideLoader();
                    break;
            }
        }
        System.prototype.config = function (options) {
            if (options.base) {
                this.loader.base = options.base;
            }
        };
        System.prototype.register = function (name, deps, exec) {
            if (Array.isArray(name)) {
                this.loader.register('@', name, deps);
            }
            else {
                this.loader.register(name, deps, exec);
            }
        };
        System.prototype.import = function (name) {
            return this.loader.import(name);
        };
        System.prototype.bundle = function (content) {
            this.loader.bundle(content);
        };
        return System;
    })();
    Ecmal.System = System;
    function run() {
        var system = new Ecmal.System();
        /*if(system.loader.main){
            system.import(system.loader.main).then(Main=>{
                return "OK";
            }).catch(e=>console.log(e.stack));
        }*/
        if (typeof global != 'undefined') {
            Object.defineProperty(global, 'System', {
                value: system
            });
            Object.defineProperty(global, 'require', {
                value: require
            });
        }
        return system;
    }
    Ecmal.run = run;
})(Ecmal || (Ecmal = {}));
var System = Ecmal.run();
//# sourceMappingURL=package.js.map