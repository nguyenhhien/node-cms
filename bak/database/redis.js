'use strict';

(function(module) {
    var redis               = require('redis');
    var winston             = require('winston');
    var Q                   = require("q");

    var redisClient;

    module.init = function() {
        var deferred = Q.defer();

        redisClient = redis.createClient({
            host: Config.Redis.host,
            port: Config.Redis.port,
            database: Config.Redis.db,
            password: Config.Redis.pass
        });

        redisClient.on("error", function (error) {
            var errorMsg = 'Failed to connect to Redis: ' + error.stack;
            winston.error(errorMsg);
            return deferred.reject(errorMsg);
        });

        redisClient.on("connect", function () {
            redisClient.select(Config.Redis.db, function(err, data){
                if(err) return deferred.reject(err.stack || err);
                winston.info('Connect to Redis successfully', Config.Redis.db);
                return deferred.resolve();
            })
        });

        module.client = redisClient;

        //util method for redis database
        require('./redis/main')(redisClient, module);
        require('./redis/hash')(redisClient, module);
        require('./redis/sets')(redisClient, module);
        require('./redis/sorted')(redisClient, module);
        require('./redis/list')(redisClient, module);

        return deferred.promise;
    };

    module.close = function() {
        if(redisClient) redisClient.quit();
    };
}(exports));