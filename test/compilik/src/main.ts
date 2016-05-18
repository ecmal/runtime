import TS from "compiler/index";

const FS = system.node.require('fs');
const PATH = system.node.require('path');
const Crypto = system.node.require('crypto');

export class CompilerSource {

    public file:string;
    public root:string;
    public project:string;
    public module:string;
    public content:string;
    public version:string;

    public setContent(content){
        Object.defineProperty(this,'content',{
            enumerable      : false,
            configurable    : true,
            writable        : true,
            value           : content
        });
        Object.defineProperty(this,'version',{
            enumerable      : false,
            configurable    : true,
            writable        : true,
            value           : Crypto.createHash('md5').update(content).digest("hex")
        });
    }
    constructor(data:any){
        this.file     = data.file;
        this.root     = data.root;
        this.project  = data.project;
        this.module   = data.module;
        this.setContent(data.content);
    }
}
export class CompilerService implements TS.LanguageServiceHost {
    private compiler:Compiler;
    constructor(compiler:Compiler){
        this.compiler = compiler;
    }
    public getCompilationSettings(): TS.CompilerOptions {
        return this.compiler.options;
    }

    public getScriptFileNames(): string[]{
        return this.compiler.getSourceNames();
    }
    public getScriptVersion(fileName: string):string {
        if(this.compiler.hasSource(fileName)){
            return this.compiler.getSource(fileName).version;
        }
    }
    public getScriptSnapshot(fileName: string): TS.IScriptSnapshot {
        if(this.compiler.hasSource(fileName)){
            return TS.ScriptSnapshot.fromString(this.compiler.getSource(fileName).content);
        }
    }
    public getCurrentDirectory(): string {
        return '.';
    }
    public getDefaultLibFileName(options: TS.CompilerOptions): string {
        return 'core/package.d.ts';
    }
    public resolveModuleNames(moduleNames: string[], containingFile: string): TS.ResolvedModule[]{
        return moduleNames.map(moduleName=>{
            if(moduleName=='global'){
                return {resolvedFileName:moduleName};
            }
            var resolvedFileName = moduleName;
            if(resolvedFileName[0]=='.'){
                resolvedFileName = PATH.resolve('/'+PATH.dirname(containingFile),moduleName).substr(1);
            }
            var resolvedModuleName = resolvedFileName.replace(/(\.d\.ts|\.tsx|\.ts)$/,'');
            for(var ext of ['ts','d.ts','tsx']){
                if(this.compiler.hasSource(`${resolvedModuleName}.${ext}`)){
                    resolvedFileName =  `${resolvedModuleName}.${ext}`;
                    break;
                }
            }
            if(!this.compiler.hasSource(resolvedFileName)){
                resolvedFileName = resolvedFileName.split('/')[0]+'/package.d.ts';
            }
            if(!this.compiler.hasSource(resolvedFileName)){
                console.info("WARNING",resolvedFileName,containingFile,moduleName);
            }
            return {resolvedFileName};
        });
    }
}
export class Compiler {
    private service:TS.LanguageService;
    private sources:{[n:string]:CompilerSource};
    public options:TS.CompilerOptions;
    public hasSource(name:string):boolean {
        return !!this.sources[name];
    }
    public getSource(name:string):CompilerSource {
        return this.sources[name];
    }
    public getSourceNames():string[]{
        return Object.keys(this.sources);
    }
    constructor(roots:any,options:TS.CompilerOptions){
        Object.defineProperty(this,'options',{
            enumerable      : false,
            configurable    : false,
            writable        : true,
            value           : options
        });
        Object.defineProperty(this,'sources',{
            enumerable      : false,
            configurable    : false,
            writable        : true,
            value           : this.read(roots).reduce((p,c)=>{
                p[c.module] = c;
                return p;
            },Object.create(null))
        });
        this.service = TS.createLanguageService(new CompilerService(this),TS.createDocumentRegistry());
        this.getSourceNames().forEach(s=>{
            this.compile(s);
        });
        setTimeout(()=>{
            console.info("COMPILE OTHER");
            var sourceFile = this.getSource('models/main.ts');
            sourceFile.setContent('export function Hello(){\n}');

            this.compile('models/main.ts');
        },5000);

    }

    read(roots:any){
        return Object.keys(roots).map((name:string)=>{
            return this.readSources(name,roots[name])
        }).reduce((previous,current)=>current.concat(previous),[]);
    }
    readSources(project:string,root:string){
        return this.readDir(root).map(f=>{
            return new CompilerSource({
                file    : f,
                root    : root,
                project : project,
                module  : project+'/'+PATH.relative(root,f),
                content : this.readFile(f)
            })
        });
    }
    readDir(dir:string){
        var items = FS.readdirSync(dir).map((s)=>{
            return PATH.resolve(dir,s);
        });
        var files=[], dirs=[];
        items.forEach((f)=>{
            var ext = PATH.extname(f);
            if(FS.statSync(f).isDirectory()){
                dirs.push(f);
            }else
            if(ext=='.ts' || ext=='.tsx'){
                files.push(f);
            }
        });
        dirs.forEach((d)=> {
            files = files.concat(this.readDir(d));
        });
        return files;
    }
    readFile(file:string){
        return FS.readFileSync(file,'utf8');
    }

    compile(fileName:string){
        let output = this.service.getEmitOutput(fileName);

        if (!output.emitSkipped) {
            console.log(`Emitting ${fileName}`);
        }
        else {
            console.log(`Emitting ${fileName} failed`);
            this.logErrors(fileName);
        }
        output.outputFiles.forEach(o=>{
            console.info(o.name);
            console.info(o.text);
        });
    }

    logErrors(fileName: string) {
        let allDiagnostics = this.service.getCompilerOptionsDiagnostics()
            .concat(this.service.getSyntacticDiagnostics(fileName))
            .concat(this.service.getSemanticDiagnostics(fileName));

        allDiagnostics.forEach(diagnostic => {
            let message = TS.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                console.log(`  Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            } else {
                console.log(`  Error: ${message}`);
            }
        });
    }
}

export default new Compiler({
    core        : '/Users/Sergey/Work/BB/wcb-project/runtime/out/core',
    runtime     : '/Users/Sergey/Work/BB/wcb-project/runtime/out/runtime',
    models      : '/Users/Sergey/Work/BB/wcb-project/runtime/test/models/src',
    cyclic      : '/Users/Sergey/Work/BB/wcb-project/runtime/test/cyclic/src'
},{
    module                      : TS.ModuleKind.System,
    target                      : TS.ScriptTarget.ES5,
    experimentalDecorators      : true,
    emitDecoratorMetadata       : true
});