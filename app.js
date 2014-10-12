require("./server/constant.js");
ROOTDIR = __dirname;

var winston             = require('winston');
var http				= require("http");
var domainWrapper       = require('domain').create();
var cluster             = require('cluster');

domainWrapper.on('error', function(err){
    console.log("[ERROR: ] in domain wrapper", err.stack || err);
});

http.ServerResponse.prototype.success = function(data)
{
    if(typeof data === 'object')
    {
        this.json(200, data || {});
    }
    else
    {
        this.json(200);
    }
}

http.ServerResponse.prototype.error = function(statusCode, error)
{
    //swap parameter if only one argument is supplied
    if(!error)
    {
        error = statusCode;
    }

    var error = error.error || error.message || error;

    return this.status(400).send(error);
}

if(process.env.cluster)
{
    //cluster support -- with cluster, app can handle 1000+ request / seconds (tested)
    //TODO: each process should be wrapped in its own domain
    if (cluster.isMaster) {
        var cpuCount = require('os').cpus().length;

        //TODO: master process should do thing like syncSchema -- so move logic to master process only
        winston.info("Fork process in " + cpuCount + " CPUs");

        // Create a worker for each CPU
        for (var i = 0; i < cpuCount; i += 1) {
            cluster.fork();
        }

        cluster.on('exit', function(worker, code, signal) {
            console.log('worker ' + worker.process.pid + ' died');
        });
    }
    else
    {
        //wrap process in domain wrapper so that no hidden exception
        domainWrapper.run(function(){
            var beaver = require('./Beaver.js');
            beaver.start();
        });
    }
}
else
{
    //wrap process in domain wrapper so that no hidden exception
    domainWrapper.run(function(){
        var beaver = require('./Beaver.js');
        beaver.start();
    });
}




