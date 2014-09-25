'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');

    fs.readdirSync(__dirname)
        .filter(function(file) {
            return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.indexOf('.js') !== -1)
        })
        .forEach(function(file) {
            //export modules
            module[path.basename(file, ".js")] = require(path.join(__dirname, file));
        });

}(exports));