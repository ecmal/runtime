require('../out/runtime/package');
System.import('cyclic/cyclic')
    .then(function(r){
        console.info(r)
    })
    .catch(function(e){
        console.error(e.stack)
    })
;