var async = require('async');
var os = require('os');
var cluster = require('cluster');

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

module.exports = master;
