require('./out/runtime/package');
System.import('nodejs/main')
    .then(function(r){
        console.info(new r.Main("JAN"));
    })
    .catch(function(e){
        console.error(e.stack)
    })
;