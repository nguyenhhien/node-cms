'use strict';

(function(module) {
    var mongodb             = require('mongodb');
    var winston             = require('winston');
    var Q                   = require("q");
    var redis               = require('../../database/redis.js');
    var SocketModules       = require('../modules');

    //API method -- as socket handler
    module.loadMore = function(socket, data, callback) {
        if(!data || !data.set || parseInt(data.offset, 10) < 0) {
            return callback('[socket: invalid-data]');
        }

        var start = data.offset,
            end = start + ((data.limit - 1) || 19);

        Q.denodeify(redis.getSortedSetRevRange)("users:online", start, end)
            .then(function(uids){
                return Q.denodeify(redis.getObjectsFields)(uids.map(function(uid){
                    return "user:" + uid;
                }), ['id', 'name', 'email', 'avatar', 'status', 'lastonline']);
            })
            .then(function(userData){
                if(!userData || !userData.length) return callback(null, {results: []});

                userData = userData.filter(function(item) {
                    return item.status !== 'offline';
                });

                callback(null, {
                    results: userData
                });
            })
            .fail(function(err){
                winston.error(err.stack || err);
                callback(err, {})
            });
    };

}(exports));