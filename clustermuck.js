var os = require('os');
var cluster = require('cluster');
var async = require('async');

//options:
//
//serverInit: required function called to start a worker webserver
//  serverInit should return a server object that responds to close and listen
//port: required port that the worker server listens on
//preCollect: optional function called before garbage collection starts
//postCollect: optional function called after garbage collection finishes
//
//options with defaults.
//minWorkers: minimum number of worker servers to handle connections
//maxWorkers: maximum number of worker servers to handle connections

module.exports.startProcess = function(options){
  if(cluster.isMaster){
   master(options);
  } else {
   worker(options);
  }
}

//the master process launches child processes and manages the garbage collection timing
var master = function(options){
  var numWorkers = determineNumWorkers(options);
  var timeForCollection = options.timeForCollection || 20000;

  cluster.setupMaster({
    execArgv: ['--expose-gc']
  });

  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  function gcLoop(){
    async.eachSeries(Object.keys(cluster.workers), gcWorker, callGcLoop)
  }
  function gcWorker(workerID, callback){
    function workerMessageHandler(msg){
      if(msg == 'garbage collected'){
        cluster.workers[workerID].removeListener('message', workerMessageHandler);
        callback();
        }
      }
    cluster.workers[workerID].on('message', workerMessageHandler);
    cluster.workers[workerID].send('collect garbage');
  }
  function callGcLoop(){
    setImmediate(gcLoop);
  }
 
  setTimeout(gcLoop, 1000);
}

function determineNumWorkers(options){
  var minWorkers = options.minWorkers || 3;
  var maxWorkers = options.maxWorkers || 5; 
  var numCPUs = require('os').cpus().length;
  if(numCPUs < minWorkers){
    var numWorkers = minWorkers;
  } else if (numCPUs > maxWorkers) {
    var numWorkers = maxWorkers;
  } else {
    var numWorkers = numCPUs;
  }
  return numWorkers;
}

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
