require('../../out/runtime/package');
system.import('compilik/main')
    .catch(function(e){
        console.error(e.stack)
    })
;