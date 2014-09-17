'use strict';

var buildDictionary     = require('sails-build-dictionary');

//load modules
(function(module) {
    module = module || {};

    module.init = function(beaver, callback)
    {
        //load controller
        buildDictionary.optional({
            dirname: beaver.config.global.paths.controller,
            filter: /(.+)Controller\.(js|coffee|litcoffee)$/,
            flattenDirectories: true,
            keepDirectoryPath: true,
            replaceExpr: /Controller/
        }, function(err, dictionary){
            beaver.controllers = dictionary;
            callback && callback(err, dictionary);
        });
    }
}(exports));