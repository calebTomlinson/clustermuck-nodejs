//initializes a worker process

var async = require('async');
//serverInit: starts a server and returns a server object
//port: the port for the server to listen on
var worker = function(options){
  var server = false;
  options.serverInit(options.port, function(initializedServer){
    server = initializedServer;
  });

    function collectGarbage(){
      try {
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
          setTimeout(function(){
            server.listen(options.port, cb)
          }, 5000);
        },
        function(cb){
          if(typeof(options.postCollect) == 'function'){
            options.postCollect(cb);
          } else {
            cb();
          }
        },
        function(cb){
          process.send('garbage collected');
          cb();
        }
      ],
        function(err){
          process.send('garbage collected');
          process.send('clustermuck garbage collection error: ' + err);
        }
      );
      } catch (err){
        process.send('clustermuck garbage collection error: ' + err);
        process.send('garbage collected');
        try {
         server.listen(options.port);
        } catch (err) {
        }
      }
    }

    process.on('message', function(msg){
      if (msg === 'collect garbage'){
        collectGarbage();
      }
    });
}

module.exports = worker;
