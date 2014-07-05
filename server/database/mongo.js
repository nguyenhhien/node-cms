'use strict';

(function(module) {
    var mongodb             = require('mongodb');
    var winston             = require('winston');
    var Q                   = require("q");

    var mongoClient;

    module.init = function() {
        var deferred = Q.defer();

        mongodb.MongoClient.connect('mongodb://'+ Config.Mongo.host + ':' +  Config.Mongo.port + '/' +  Config.Mongo.db, function(err, _db) {
            if(err) {
                var errorMsg = "Failed to connect to mongo " + err.message;
                winston.error(errorMsg);
                return deferred.reject(errorMsg);
            }

            winston.info("connect to mongo successfully");

            mongoClient = _db;
            module.client = _db;

            //util method for mongo database
            require('./mongo/main')(mongoClient, module);
            require('./mongo/hash')(mongoClient, module);
            require('./mongo/sets')(mongoClient, module);
            require('./mongo/sorted')(mongoClient, module);
            require('./mongo/list')(mongoClient, module);

            //create index
            function createIndices() {
                mongoClient.collection('objects').ensureIndex({_key :1}, {background:true}, function(err) {
                    if(err) {
                        winston.error('Error creating index ' + err.message);
                    }
                });

                mongoClient.collection('objects').ensureIndex({'expireAt':1}, {expireAfterSeconds:0, background:true}, function(err) {
                    if(err) {
                        winston.error('Error creating index ' + err.message);
                    }
                });

                mongoClient.collection('search').ensureIndex({content:'text'}, {background:true}, function(err) {
                    if(err) {
                        winston.error('Error creating index ' + err.message);
                    }
                });

                return deferred.resolve();
            }

            createIndices();
        });

        return deferred.promise;
    };

    module.close = function() {
        if(mongoClient) mongoClient.quit();
    };

    module.helpers = module.helpers || {};
    module.helpers.mongo = require('./mongo/helpers');

}(exports));