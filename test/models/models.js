require('../../out/runtime/package');
system.import('models/main')
    .then(function(r){
        console.info(r);
    })
    .catch(function(e){
        console.error(e.stack)
    })
;