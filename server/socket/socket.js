'use strict';

(function(module) {
    var mongodb             = require('mongodb');
    var winston             = require('winston');
    var path                = require("path");
    var Q                   = require("q");
    var	SocketIO            = require('socket.io');
    var socketioWildcard    = require('socket.io-wildcard');
    var redisSocket         = require('socket.io/node_modules/redis');
    var RedisStoreSocket    = require('socket.io/lib/stores/redis');
    var cookie              = require('cookie')
    var cookieParser        = require("cookie-parser");
    var fs                  = require('fs');
    var async               = require('async');

    var redis               = require('../database/redis.js');
    var SocketModules       = require('./modules');

    var	io;
    var routeNamespaces = {};

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

        module.io = io;

        //walk through the code directory and create namespace websocket
        fs.readdir(path.join(__dirname, "routes"), function(err, files) {
            if(files.indexOf('index.js') != -1)
            {
                files.splice(files.indexOf('index.js'), 1);
            }

            async.each(files, function(lib, next) {
                if (lib.substr(lib.length - 3) === '.js') {
                    lib = lib.slice(0, -3);
                    routeNamespaces[lib] = require('./routes/' + lib);
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
                winston.info("no cookies being sent");
                return next('[socket.io] no cookie transmitted.', false);
            }

            //get session data -- user info
            Q.denodeify(redis.get)("sess:" + handshakeData.sessionID)
                .then(function(session){
                    if (!session)
                    {
                        return next('[socket.io] session not found.', false);
                    }

                    try
                    {
                        handshakeData.session = JSON.parse(session);
                        next(null, true);
                    }
                    catch (err)
                    {
                        return next("[socket.io] unable to parse redis session", false);
                    }
                })
                .fail(function(err){
                    winston.error(err.stack || err);
                    return next('[socket.io] error in session store.' + err, false);
                });
        });

        //on open connection
        io.sockets.on('connection', function(socket) {
            var hs = socket.handshake,
                sessionID, uid;

            winston.info("[socket.io] client connected");

            //assign uid for socket
            if(hs.session && hs.session.user && hs.session.user.id)
            {
                socket.uid = parseInt(hs.session.user.id, 10);
            }
            else
            {
                socket.uid = 0;
            }

            //for now, we don't allow anonymous login
            if(socket.uid)
            {
                //update the redis user session base
                var sessionUser = hs.session.user;
                sessionUser.status = 'online';

                Q.denodeify(redis.setObject)("user:" + socket.uid, sessionUser)
                    .then(function(){
                        //add to list of sorted set
                        return Q.denodeify(redis.sortedSetAdd)("users:online", Date.now(), socket.uid);
                    })
                    .then(function(data){
                        //emit event connect -- only for logged in user
                        socket.emit('event:connect', {
                            status: 'online',
                            name: hs.session && hs.session.user.name,
                            avatar: hs.session && hs.session.user.avatar,
                            id: hs.session && hs.session.user.id
                        });

                        return SocketModules.User.isOnline(socket.uid);
                    })
                    .then(function(data){
                        //broadcast login event for all connected client
                        socket.broadcast.emit('user.isOnline', null, data);
                    })
                    .fail(function(err){
                        winston.error(err.stack || err);
                    });
            }

            socket.on('disconnect', function() {
                winston.info("[socket.io] client disconnected");

                //broadcast online status of that user
                if (socket.uid && SocketModules.Core.getUserSockets(socket.uid).length <= 1) {
                    Q.denodeify(redis.sortedSetRemove)("users:online", socket.uid)
                        .then(function(){
                            //need this -- because users can use multiple client to connect
                            return SocketModules.User.isOnline(socket.uid)
                        })
                        .then(function(data){
                            socket.broadcast.emit('user.isOnline', null, data);
                        })
                        .fail(function(err){
                            winston.error(err.stack || err);
                        });
                }
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
                    }, routeNamespaces);


                if(!methodToCall) {
                    return winston.warn('[socket.io] Unrecognized message: ' + payload.name);
                }

                if(socket.uid) {
                    SocketModules.User.updateLastOnlineTime(socket.uid);
                }

                //call the method
                methodToCall.call(null, socket, payload.args.length ? payload.args[0] : null, function(err, result) {
                    if (callback)
                    {
                        callback(err?{error: (err.stack || err.error || err)}:null, result);
                    }
                });
            });
        });
    }
}(exports));