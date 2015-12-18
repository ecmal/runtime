var ts = require('../lib/typescript/typescript');

console.log(ts.transpile("import {f} from 'foo';export var x = f()", {
    module: ts.ModuleKind.System
}, undefined, undefined, "myModule1"));


