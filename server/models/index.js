'use strict';

//load config files
(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');

    module = module || {};

    fs.readdirSync(__dirname)
        .filter(function (file) {
            return fs.statSync(path.join(__dirname, file)).isDirectory();
        })
        .forEach(function(dir){
            var fullPath = path.join(__dirname, dir);
            fs.readdirSync(fullPath)
                .filter(function(file) {
                    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.indexOf('.js') !== -1)
                })
                .forEach(function(file) {
                    module[dir] = module[dir] || {};
                    module[dir][path.basename(file, '.js')] = require(path.join(fullPath, file));
                });
        });

}(exports));