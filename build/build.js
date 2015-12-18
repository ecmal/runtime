var compiler = require('./compiler');
var fs = require('fs');
var path = require('path');
var utils = require('./utils');

var outDir = path.resolve(__dirname,'../out');
var srcDir = path.resolve(__dirname,'../test');
var libDir = path.resolve(__dirname,'../lib');

var srcFiles = fs.readDirRecursive(srcDir);

srcFiles.forEach(function(f){
    var p = path.relative(srcDir,f);
    var source = fs.readFileSync(f);
    var outFile,outText;
    if(f.match(/^(.*)(\.ts)$/)){
        var result = compiler.transpile(source.toString(), {
            fileName: f,
            moduleName: p.replace(/^(.*)(\.ts)$/,'$1'),
            compilerOptions: {
                declaration: true,
                module: compiler.ModuleKind.System,
                experimentalDecorators: true,
                inlineSourceMap:true,
                inlineSources:true
            }
        });
        outFile = path.resolve(outDir,p).replace(/^(.*)(\.ts)$/,'$1.js');
        outText = result.out;
        fs.makeDirRecursive(path.dirname(outFile));
        fs.writeFileSync(outFile,result.out,'utf8');
    }else{
        outFile = path.resolve(outDir,p);
        outText = source;
    }
    fs.makeDirRecursive(path.dirname(outFile));
    fs.writeFileSync(outFile,outText,'utf8');
});

fs.copyFile(
    path.resolve(libDir,'index.js'),
    path.resolve(outDir,'runtime/index.js')
);
