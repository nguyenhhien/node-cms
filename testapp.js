require("./server/constant.js");

var http				= require("http");

//TODO: this one just for legacy code -- don't continue to use it
http.ServerResponse.prototype.success = function(data)
{
    this.json(ResponseCode.OK, data || {});
}


http.ServerResponse.prototype.error = function(statusCode, error)
{
    //swap parameter if only one argument is supplied
    if(!error)
    {
        error = statusCode;
        statusCode = ResponseCode.VALIDATION_FAILED;
    }

    if(error.error) return this.json(ResponseCode.OK, {
        error: error.error,
        code: error.statusCode || ResponseCode.VALIDATION_FAILED
    })
    //errors is object of Error type
    else if (error instanceof Error)
    {
        winston.error("error", error);
        return this.json(ResponseCode.OK, {
            error: error.message
        })
    }
    else return this.json(ResponseCode.OK, {
            error: error,
            code: statusCode
        })
}

var beaver = require('./Beaver.js');
beaver.start();


