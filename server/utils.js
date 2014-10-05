'use strict';

//load all middleware into global objects
(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');
    var childprocess 		= require("child_process");

    module = module || {};

    module.formatValidationError = function(errors)
    {
        errors = errors || [];

        //remove duplicate element
        errors = errors.filter(function(elem, pos) {
            return errors.map(function(error){return error.param;}).indexOf(elem.param) == pos;
        });

        var errorMsg = "Invalid Params (";
        errorMsg += (errors || []).map(function(elem){
            return elem.param;
        }).join(",") + ")";

        errorMsg += " .Received (" +  (errors || []).map(function(elem){
            return elem.value;
        }).join(",") + ")";

        return errorMsg;
    }

    module.regexEscape= function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    //spawn external process
    //TODO: auto kill when exceeding timeout allowed
    module.spawnProcess = function(cmd, args)
    {
        var deferred = Q.defer();

        var process = childprocess.spawn(cmd, args);

        process.stdout.on("data", function(data)
        {
            console.debug("convert: "+data);
        });

        process.stderr.on("data", function(data)
        {
            console.error("convert: "+data);
        });

        process.on("exit", function(code)
        {
            if (code != 0)
            {
                deferred.reject("Error while converting image, code: "+code);
            }
            else
            {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }
}(exports));