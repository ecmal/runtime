require('./runtime');
System.import('application/App').catch(function(e){
    console.error(e.stack);
});