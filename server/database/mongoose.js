'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');
    var mongoose            = require('mongoose-q')();

    module.init = function() {
        var deferred = Q.defer();

        mongoose.connect('localhost', 'auth');

        mongoose.connection.on('open', function() {
            winston.info("open mongodb database");
            return deferred.resolve();
        });

        mongoose.connection.on('error', function() {
            winston.error('connection error');
            return deferred.reject("Error when opening database connection, mongoose");
        });

        //export mongoose models
        var models = {};
        var modelDir = path.join(__dirname, "mongoose/models");

        fs.readdirSync(modelDir)
            .filter(function(file) {
                return (file.indexOf('.') !== 0) && (file !== 'index.js')
            })
            .forEach(function(file) {
                models[path.basename(file, '.js')] = require(path.join(modelDir, file));
            });

        //export models + client to sequelize
        module = _.extend(module, {
            models: models
        });

        return deferred.promise;
    };

}(exports));