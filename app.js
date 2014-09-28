require("./server/constant.js");

var winston             = require('winston');
var http				= require("http");

//TODO: this one just for legacy code -- don't continue to use it
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

    return this.status(501).send(error);
}

var beaver = require('./Beaver.js');
beaver.start();


