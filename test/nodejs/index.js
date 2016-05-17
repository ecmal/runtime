require('./out/runtime/package');
system.import('nodejs/index')
    .catch(function(e){
        console.error(e.stack)
    })
;