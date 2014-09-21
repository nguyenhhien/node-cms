'use strict';

(function(module) {
    var mongodb             = require('mongodb');
    var winston             = require('winston');
    var Q                   = require("q");
    var redis               = require('../../database/redis.js');
    var Socket              = require('../socket.js');

    //get all distinguist uuid of websocket
    module.getConnectedClients = function() {
        var uids = [];
        if (!Socket.io) {
            return uids;
        }
        var clients = Socket.io.sockets.sockets;

        clients.forEach(function(client) {
            if(client.uid && uids.indexOf(client.uid) === -1) {
                uids.push(client.uid);
            }
        });
        return uids;
    };

    //get all sockets clients of given uid (userId)
    module.getUserSockets = function(uid) {
        var sockets = Socket.io.sockets.sockets;
        if(!sockets || !sockets.length) {
            return [];
        }

        sockets = sockets.filter(function(s) {
            return s.uid === parseInt(uid, 10);
        });

        return sockets;
    };

    //get all rooms which a certain users go in
    module.getUserRooms = function(uid) {
        var sockets = module.getUserSockets(uid);
        var rooms = {};
        for (var i=0; i<sockets.length; ++i) {
            var roomClients = Socket.io.sockets.manager.roomClients[sockets[i].id];
            for (var roomName in roomClients) {
                rooms[roomName.slice(1)] = true;
            }
        }
        rooms = Object.keys(rooms);
        return rooms;
    };

    module.in = function(room) {
        return Socket.io.sockets.in(room);
    };

    module.logoutUser = function(uid) {
        module.getUserSockets(uid).forEach(function(socket) {
            //Destroy session
            if (socket.handshake && socket.handshake.signedCookies && socket.handshake.signedCookies['sid']) {
                //db.sessionStore.destroy(socket.handshake.signedCookies['sid']);
                //TODO: destroy redis session here
            }

            socket.emit('event:disconnect');
            socket.disconnect();
        });
    };

    module.emitUserInRoom = function(roomName)
    {
        if (!roomName) {
            return;
        }

        function getUidsInRoom() {
            var uids = [];
            var clients = Socket.io.sockets.sockets(roomName);
            for(var i=0; i<clients.length; ++i) {
                if (uids.indexOf(clients[i].uid) === -1 && clients[i].uid !== 0) {
                    uids.push(clients[i].uid);
                }
            }
            return uids;
        }

        var	uids = getUidsInRoom();
        var uKeys = uids.map(function(uid){
            return "user:" + uid;
        });

        Q.denodeify(redis.getObjectsFields)(uKeys, ["id", "name", "status", "avatar"])
            .then(function(users){
                users = users.filter(function(user) {
                    return user.status !== 'offline';
                });

                Socket.io.sockets.in(roomName).emit('event:update_users_in_room', {
                    users: users,
                    room: roomName
                });
            });
    }

    //get number of users who is online
    module.emitOnlineUserCount = function(callback) {
        if (callback) {
            callback(null, {
                users: module.getConnectedClients().length
            });
        }
        else
        {
            Socket.io.sockets.emit('user.getActiveUsers', null, {
                users: module.getConnectedClients().length
            });
        }
    }
}(exports));