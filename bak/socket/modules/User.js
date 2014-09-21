'use strict';

(function(module) {
    var mongodb             = require('mongodb');
    var winston             = require('winston');
    var Q                   = require("q");
    var redis               = require('../../database/redis.js');
    var SocketCore          = require('./Core.js');

    module.isOnline = function(uid) {
        return Q.denodeify(redis.getObjectFields)('user:' + uid, ["id", "name", "status", "avatar", "email"])
            .then(function(data){
                //check if there is connected client
                var online = SocketCore.getUserSockets(uid).length > 0;

                data.status = online ? (data.status || 'online') : 'offline';

                if(data.status === 'offline') {
                    online = false;
                }

                data.online = online;
                data.uid = uid;
                data.timestamp = Date.now();
                //data.rooms = SocketCore.getUserRooms(uid);

                return Q.resolve(data);
            });
    };

    module.updateLastOnlineTime = function(uid) {
        return Q.denodeify(redis.getObjectFields)("user:" + uid, ['status'])
            .then(function(data){
                if(data.status === 'offline') return Q();
                return Q.denodeify(redis.setObjectField)("user:" + uid, 'lastonline', new Date());
            });
    };
}(exports));