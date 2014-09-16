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
            module[dir] = module[dir] || {};

            var fullPath = path.join(__dirname, dir);

            fs.readdirSync(fullPath)
                .filter(function(file) {
                    return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.indexOf('.js') !== -1)
                })
                .forEach(function(file) {

                    var modelName = path.basename(file, '.js');
                    //also bind the lowercase to the same model --      module[dir][modelName.toLowerCase()] =
                    module[dir][modelName] = require(path.join(fullPath, file));
                });
        });

    module.sequelizePath = path.join(__dirname, "sequelize");

}(exports));