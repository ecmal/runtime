namespace Ecmal {
    export class Path {
        static SEP = '/';
        static filename(path:String) {
            return path.split(Path.SEP).pop();
        }
        static dirname(path) {
            path = path.split('/');
            path.pop();
            path = path.join('/');
            return path;
        }
        static normalize(path) {
            if (!path || path === '/') {
                return '/';
            }
            var prepend = (path[0] == '/' || path[0] == '.');
            var target = [], src, scheme, parts, token;
            if (path.indexOf('://') > 0) {
                parts = path.split('://');
                scheme = parts[0];
                src = parts[1].split('/');
            } else {
                src = path.split('/');
            }
            for (var i = 0; i < src.length; ++i) {
                token = src[i];
                if (token === '..') {
                    target.pop();
                } else if (token !== '' && token !== '.') {
                    target.push(token);
                }
            }
            return (
                (scheme ? scheme + '://' : '') +
                (prepend ? '/' : '') +
                target.join('/').replace(/[\/]{2,}/g, '/')
            );
        }
        static resolve(...paths) {
            var current = paths.shift();
            for(let path,p =0;p<paths.length;p++){
                path=paths[p];
                if (path[0] == '/') {
                    current = path;
                } else {
                    current = Path.normalize(current + '/' + path)
                }
            }
            return current;
        }
    }
}
