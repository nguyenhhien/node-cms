'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');
    var mongoose            = require('mongoose-q')();

    module.init = function(beaver) {
        var deferred = Q.defer();

        mongoose.connect('localhost', beaver.config.adapters.Mongo.db);

        mongoose.connection.on('open', function() {
            beaver.winston.info("open mongodb database");
            return deferred.resolve();
        });

        mongoose.connection.on('error', function() {
            beaver.winston.error('connection error');
            return deferred.reject("Error when opening database connection, mongoose");
        });

        //export models + client to sequelize
        module = _.extend(module, {
            client: mongoose.connection
        });

        return deferred.promise;
    };

    module.close = function()
    {
        var deferred = Q.defer();

        mongoose.connection.close(function(err){
            winston.info("close database");
            deferred.resolve();
        });

        return deferred.promise;
    }

}(exports));