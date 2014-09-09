//initializes a worker process

var async = require('async');
//serverInit: starts a server and returns a server object
//port: the port for the server to listen on
var worker = function(options){
  options.serverInit(options.port, function(server){

    function collectGarbage(){
      async.series([
        function(cb){
          server.close(cb)
        },
        function(cb){
          if(typeof(options.preCollect) == 'function'){
            options.preCollect(cb);
          } else
            cb();
        },
        function(cb){
          global.gc();
          server.listen(options.port, cb)
        },
        function(cb){
          if(typeof(options.postCollect) == 'function'){
            options.postCollect(cb);
          } else {
            cb();
          }
        },
        function(cb){
          process.send('garbage collected')
          cb();
        }
      ],
        function(err){
          process.send('clustermuck garbage collection error: ' + err);
        }
      );
    }

    process.on('message', function(msg){
      if (msg === 'collect garbage'){
        collectGarbage();
      }
    });
  });
}

module.exports = worker;
