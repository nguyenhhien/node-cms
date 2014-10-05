'use strict';

//load all middleware into global objects
(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');

    module = module || {};

    fs.readdirSync(__dirname)
        .filter(function(file) {
            return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.indexOf('.js') !== -1)
        })
        .forEach(function(fileName){
            var fullPath = path.join(__dirname, fileName);
            module[path.basename(fileName, ".js")] = require(fullPath);
        });

}(exports));