var ts = require('typescript');

exports.ModuleKind = ts.ModuleKind;
exports.transpile = function transpileModule(input, transpileOptions) {
    const options = transpileOptions.compilerOptions ? ts.clone(transpileOptions.compilerOptions) : getDefaultCompilerOptions();
    options.isolatedModules = true;
    // Filename can be non-ts file.
    options.allowNonTsExtensions = true;
    // We are not returning a sourceFile for lib file when asked by the program,
    // so pass --noLib to avoid reporting a file not found error.
    options.noLib = true;
    // We are not doing a full typecheck, we are not resolving the whole context,
    // so pass --noResolve to avoid reporting missing file errors.
    options.noResolve = true;
    // if jsx is specified then treat file as .tsx
    var inputFileName = transpileOptions.fileName || (options.jsx ? "module.tsx" : "module.ts");
    var sourceFile = ts.createSourceFile(inputFileName, input, options.target);
    if (transpileOptions.moduleName) {
        sourceFile.moduleName = transpileOptions.moduleName;
    }
    sourceFile.renamedDependencies = transpileOptions.renamedDependencies;
    var newLine = ts.getNewLineCharacter(options);
    // Output
    var outputText;
    var sourceMapText;
    var definitionText;
    // Create a compilerHost object to allow the compiler to read and write files
    const compilerHost = {
        getSourceFile: function (fileName, target) {
            return fileName === ts.normalizeSlashes(inputFileName) ? sourceFile : undefined
        },
        writeFile: function (name, text, writeByteOrderMark) {
            console.info(name);
            if (ts.fileExtensionIs(name, ".map")) {
                sourceMapText = text;
            } else
            if(ts.fileExtensionIs(name, ".d.ts")){
                definitionText = text;
            }else{
                outputText = text;
            }
        },
        getDefaultLibFileName: function () {
            return "lib.d.ts"
        },
        useCaseSensitiveFileNames: function () {
            return false
        },
        getCanonicalFileName: function (fileName) {
            return fileName
        },
        getCurrentDirectory: function () {
            return ""
        },
        getNewLine: function () {
            return newLine
        },
        fileExists: function (fileName) {
            return fileName === inputFileName
        },
        readFile: function (fileName) {
            return ""
        }
    };
    const program = ts.createProgram([inputFileName], options, compilerHost);
    var diagnostics;
    if (transpileOptions.reportDiagnostics) {
        diagnostics = [];
        ts.addRange(/*to*/ diagnostics, /*from*/ program.getSyntacticDiagnostics(sourceFile));
        ts.addRange(/*to*/ diagnostics, /*from*/ program.getOptionsDiagnostics());
    }
    // Emit
    program.emit();
    return {
        diagnostics: diagnostics,
        out: outputText,
        tsd: definitionText,
        map: sourceMapText
    }
};