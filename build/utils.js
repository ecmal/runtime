var fs = require('fs');
var path = require("path");
fs.makeDirRecursive = function makeDirRecursive(dir) {
    var parts = path.normalize(dir).split(path.sep);
    dir = '';
    for (var i = 0; i < parts.length; i++) {
        dir += parts[i] + path.sep;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, 0x1FD);
        }
    }
};
fs.readDirRecursive = function readDirRecursive(dir) {
    var items = fs.readdirSync(dir).map(function (s){
        return path.resolve(dir,s);
    });
    var files=[],dirs=[];
    items.forEach(function (f){
        if(fs.statSync(f).isDirectory()){
            dirs.push(f);
        }else{
            files.push(f);
        }
    });
    dirs.forEach(function (d){
        files = files.concat(fs.readDirRecursive(d));
    });
    return files;
};
fs.removeDirRecursive = function removeDirRecursive(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                fs.removeDirRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
fs.copyFile = function makeDirRecursive(fromPath,toPath) {
    fs.makeDirRecursive(path.dirname(toPath));
    fs.writeFileSync(toPath,fs.readFileSync(fromPath));
};