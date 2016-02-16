require('./out/runtime/package');
System.import('nodejs/index')
    .catch(function(e){
        console.error(e.stack)
    })
;