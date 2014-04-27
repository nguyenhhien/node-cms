//extend the http object
module.exports = function(http)
{
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
            logger.error("error", error);
            return this.json(ResponseCode.OK, {
                error: error.message
            })
        }
        else return this.json(ResponseCode.OK, {
            error: error,
            code: statusCode
        })
    }
}