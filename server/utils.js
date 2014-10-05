'use strict';

//load all middleware into global objects
(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');

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

}(exports));