'use strict';

(function(module) {
    var mongodb             = require('mongodb');
    var winston             = require('winston');
    var Q                   = require("q");
    var	SocketIO            = require('socket.io');
    var socketioWildcard    = require('socket.io-wildcard');
    var redisSocket         = require('socket.io/node_modules/redis');
    var RedisStoreSocket    = require('socket.io/lib/stores/redis');
    var redis               = require('../database/redis.js');
    var cookie              = require('cookie')
    var cookieParser        = require("cookie-parser");
    var fs                  = require('fs');
    var async               = require('async');
    var	io;
    var Namespaces = {};

    //init for websocket and listen for event
    module.init = function(server)
    {
        //redis session store to support nodejs clustering
        var pub = redisSocket.createClient(Config.Redis.port,Config.Redis.host);
        var sub = redisSocket.createClient(Config.Redis.port,Config.Redis.host);
        var store = redisSocket.createClient(Config.Redis.port,Config.Redis.host);

        pub.auth(Config.Redis.pass, function(err){winston.info(!!err?err:"redis socket pub")});
        sub.auth(Config.Redis.pass, function(err){winston.info(!!err?err:"redis socket sub")});
        store.auth(Config.Redis.pass, function(err){winston.info(!!err?err:"redis socket store")});

        //attach server to this socket for it to listen on
        io = socketioWildcard(SocketIO).listen(server, {
            log: false,
            transports: ['websocket', 'xhr-polling', 'jsonp-polling', 'flashsocket'],
            'browser client minification': true
        });

        io.set('log level', 1);
        io.set('store', new RedisStoreSocket({redisPub:pub, redisSub:sub, redisClient:store}));

        //walk through the code directory and create namespace websocket
        fs.readdir(__dirname, function(err, files) {
            files.splice(files.indexOf('index.js'), 1);

            async.each(files, function(lib, next) {
                if (lib.substr(lib.length - 3) === '.js') {
                    lib = lib.slice(0, -3);
                    Namespaces[lib] = require('./' + lib);
                }

                next();
            });
        });

        //authorization cookies
        io.set('authorization', function (handshakeData, next) {
            if (handshakeData.headers.cookie)
            {
                handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
                handshakeData.sessionID = cookieParser.signedCookie(handshakeData.cookie['sid'], Config.Global.sessionSecret);

                if (handshakeData.cookie['sid'] == handshakeData.sessionID)
                {
                    return next('[socket.io] cookie is invalid.', false);
                }
            }
            else
            {
                return next('[socket.io] no cookie transmitted.', false);
            }

            //get session data -- user info
            redis.client.get("sess:" + handshakeData.sessionID, function(err, session){
                if (err) {
                    return next('[socket.io] error in session store.', false);
                } else if (!session) {
                    return next('[socket.io] session not found.', false);
                }

                try {
                    handshakeData.session = JSON.parse(session);
                    next(null, true);
                } catch (err) {
                    return next("[socket.io] unable to parse redis session", false);
                }

                //winston.info("session user info", handshakeData.session && handshakeData.session.user);
            })
        });

        //on open connection
        io.sockets.on('connection', function(socket) {
            var hs = socket.handshake,
                sessionID, uid;

            winston.info("[socket.io] client connected");

            //emit event connect -- only for logged in user
            socket.emit('event:connect', {
                status: 1,
                name: hs.session && hs.session.user.name,
                avatar: hs.session && hs.session.user.avatar,
                id: hs.session && hs.session.user.id
            });

            //broadcast login event
            //socket.broadcast.emit('user.isOnline', err, data);

            socket.on('disconnect', function() {
                winston.info("[socket.io] client disconnected");
            });

            socket.on('*', function(payload, callback) {
                if(!payload.name) {
                    return winston.warn('[socket.io] Empty method name');
                }

                //get method from namespaces
                var parts = payload.name.toString().split('.'),
                    namespace = parts.slice(0, 1),
                    methodToCall = parts.reduce(function(prev, cur) {
                        if (prev !== null && prev[cur]) {
                            return prev[cur];
                        } else {
                            return null;
                        }
                    }, Namespaces);


                if(!methodToCall) {
                    return winston.warn('[socket.io] Unrecognized message: ' + payload.name);
                }

                //call the method
                //TODO: update user datetime
                methodToCall.call(null, socket, payload.args.length ? payload.args[0] : null, function(err, result) {
                    if (callback) {
                        callback(err?{message:err.message}:null, result);
                    }
                });
            });
        });
    }
}(exports));