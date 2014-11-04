var cluster = require('cluster');
var clustermuck = require('./clusterMuck');
var assert = require('assert');
var http = require('http');

function initServer (port, cb){
  var server = http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(String(cluster.worker.id));
    setTimeout(function(){
      response.end();
    }, 10000);
  });
  server.listen(port);
  cb(server);
}

function postCollect(cb){
  process.send('collected on ' + cluster.worker.id);
  cb();
}
function preCollect(cb){
  process.send('collecting on ' + cluster.worker.id);
  setImmediate(cb);
}

var pre = [0,0,0,0,0];
var post = [0,0,0,0,0];

function messageHandler(msg){
  if(msg === 'collecting on 1'){
    pre[1]++;
  } else if(msg === 'collecting on 2'){
    pre[2]++;
  } else if(msg === 'collecting on 3'){
    pre[3]++;
  } else if(msg === 'collecting on 4'){
    pre[4]++;
  } else if(msg === 'collected on 1'){
    post[1]++;
  } else if(msg === 'collected on 2'){
    post[2]++;
  } else if(msg === 'collected on 3'){
    post[3]++;
  } else if(msg === 'collected on 4'){
    post[4]++;
  }
}

var options = {
  'serverInit': initServer,
  'preCollect': preCollect,
  'postCollect': postCollect,
  'minWorkers': 4,
  'maxWorkers': 4,
  'startupTime': 100,
  'port': 8088
}

clustermuck.startProcess(options);

if(cluster.isMaster){

  Object.keys(cluster.workers).forEach(function(id) {
    cluster.workers[id].on('message', messageHandler);
  });

  //it collects and calls pre/post collect on all workers
  setTimeout(function(){
    assert(pre[1] >= 1);
    assert(pre[2] >= 1);
    assert(pre[3] >= 1);
    assert(pre[4] >= 1);
    assert(post[1] >= 1);
    assert(post[2] >= 1);
    assert(post[3] >= 1);
    assert(post[4] >= 1);
  }, 30000);

  //it finishes requests before collecting
  setTimeout(function(){
    var request = http.get('http://localhost:8088/', function(resp){
      resp.on('data', function(chunk){
        var worker = parseInt(chunk.toString());
        var workerPostGCs = post[worker];
        var workerPreGCs = pre[worker];
        setTimeout(function(){
          assert(post[worker] === workerPostGCs);
        }, 6000);

        resp.on('end', function(){
          console.log('tests passed');
          process.exit();
        });
      });
    });
  }, 35000);

  //timeout and exit 1 if not exited earlier
  setTimeout(function(){
    console.log('tests timed out');
    process.exit(1);
  }, 60000);
}
