//initializes a worker process
//serverInit: starts a server and returns a server object
//port: the port for the server to listen on
var worker = function(options){
  var server = options.serverInit();

  function collectGarbage(){
    server.close(function(){
      if(typeof(options.preCollect) == 'function'){
        options.preCollect();
      }
      global.gc();
      server.listen(options.port, function(){
        if(typeof(options.postCollect) == 'function'){
          options.postCollect();
        }
        process.send('garbage collected')
      });
    });
  }

  process.on('message', function(msg){
    if (msg === 'collect garbage'){
     collectGarbage();
    }
  }); 
}

module.exports = worker;
