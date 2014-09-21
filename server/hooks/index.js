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
            module[dir] = require(fullPath);
        });


    module.loadOrders = [
        "moduleloader",
        "adapter",
        "http",
        "beeroutes",
        "socket"
    ];

}(exports));