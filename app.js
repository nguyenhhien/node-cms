require("./server/constant.js");
ROOTDIR = __dirname;

var winston             = require('winston');
var http				= require("http");
var domainWrapper       = require('domain').create();

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

//TODO: change it into another error code
http.ServerResponse.prototype.error = function(statusCode, error)
{
    //swap parameter if only one argument is supplied
    if(!error)
    {
        error = statusCode;
    }

    var error = error.error || error.message || error;

    return this.status(501).send(error);
}

//wrap process in domain wrapper so that no hidden exception
domainWrapper.run(function(){
    var beaver = require('./Beaver.js');
    beaver.start();
});



