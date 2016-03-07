require('../../out/runtime/package');
System.import('project/node')
    .then(function(exports){
        console.info("EXPORTS",Object.keys(exports))
    })
    .catch(function(error){
        console.error(error.stack||error)
    });