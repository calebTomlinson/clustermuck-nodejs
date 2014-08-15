var cluster = require('cluster');
var master = require('./lib/master');
var worker = require('./lib/worker');

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
