'use strict';

(function(module) {
    //get all distinguist uuid of websocket
    module.getConnectedClients = function() {
        var uids = [];
        if (!io) {
            return uids;
        }
        var clients = io.sockets.clients();

        clients.forEach(function(client) {
            if(client.uid && uids.indexOf(client.uid) === -1) {
                uids.push(client.uid);
            }
        });
        return uids;
    };

    //get all sockets client of given uid
    module.getUserSockets = function(uid) {
        var sockets = io.sockets.clients();
        if(!sockets || !sockets.length) {
            return [];
        }

        sockets = sockets.filter(function(s) {
            return s.uid === parseInt(uid, 10);
        });

        return sockets;
    };

    module.getUserRooms = function(uid) {
        var sockets = module.getUserSockets(uid);
        var rooms = {};
        for (var i=0; i<sockets.length; ++i) {
            var roomClients = io.sockets.manager.roomClients[sockets[i].id];
            for (var roomName in roomClients) {
                rooms[roomName.slice(1)] = true;
            }
        }
        rooms = Object.keys(rooms);
        return rooms;
    };

    module.in = function(room) {
        return io.sockets.in(room);
    };

    module.logoutUser = function(uid) {
        module.getUserSockets(uid).forEach(function(socket) {
            //Destroy session
            //if (socket.handshake && socket.handshake.signedCookies && socket.handshake.signedCookies['express.sid']) {
                //db.sessionStore.destroy(socket.handshake.signedCookies['express.sid']);
            //}

            socket.emit('event:disconnect');
            socket.disconnect();
        });
    };
}(exports));