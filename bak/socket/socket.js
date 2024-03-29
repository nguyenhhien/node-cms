'use strict';

(function(module) {
    var mongodb             = require('mongodb');
    var winston             = require('winston');
    var path                = require("path");
    var Q                   = require("q");
    var	SocketIO            = require('socket.io');
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
        var io = SocketIO(server);

        io.set("transports", ['websocket', 'xhr-polling', 'jsonp-polling', 'flashsocket']);

        io.adapter(require('socket.io-redis')({
            host: Config.Redis.host,
            port: Config.Redis.port
        }))

        var socketioWildcard    = require('socketio-wildcard')();
        io.use(socketioWildcard);

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

        //authorize the connection
        io.use(function(socket, next) {
            var hsData = socket.request;
            var hsCookie = hsData.headers.cookie || (hsData._query && hsData._query['cookie']);

            var parsedCookie;

            Q.async(function*(){
                if (hsCookie)
                {
                    parsedCookie = cookie.parse(hsCookie);

                    if(!parsedCookie || !parsedCookie['sid'])
                    {
                        return Q.reject('[socket.io] cookie session not found');
                    }

                    hsData.sessionID = cookieParser.signedCookie(parsedCookie['sid'], Config.Global.sessionSecret);

                    if (parsedCookie['sid'] == hsData.sessionID)
                    {
                        return Q.reject('[socket.io] cookie is invalid.');
                    }
                }
                else
                {
                    winston.info("no cookies being sent");
                    return Q.reject('[socket.io] no cookie transmitted.');
                }

                var session = yield Q.denodeify(redis.get)("sess:" + hsData.sessionID);

                if (!session)
                {
                    return Q.reject('[socket.io] session not found.');
                }

                hsData.session = JSON.parse(session);

                if(hsData.session && hsData.session.user)
                {
                    next(null, true);
                }
                else
                {
                    return Q.reject('[socket.io] no session found. User might not log in');
                }
            })()
            .fail(function(error){
                winston.info("[socket.io] ERROR: ", error.stack || error);
                next(error.stack || error, false);
            });
        });

        //on open connection
        io.on('connection', function(socket) {
            var hs = socket.request,
                sessionID, uid;

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
                var sessionUser = hs.session.user;
                sessionUser.status = 'online';

                Q.async(function*(){
                    yield Q.denodeify(redis.setObject)("user:" + socket.uid, sessionUser);
                    yield Q.denodeify(redis.sortedSetAdd)("users:online", Date.now(), socket.uid);

                    winston.info("[socket.io] client connected", socket.uid);

                    socket.emit('event:connect', {
                        status: 'online',
                        name: hs.session && hs.session.user.name,
                        avatar: hs.session && hs.session.user.avatar,
                        id: hs.session && hs.session.user.id
                    });

                    var data = yield SocketModules.User.isOnline(socket.uid);
                    socket.broadcast.emit('user.isOnline', null, data);
                })()
                .fail(function(error){
                    winston.error(error.stack || error);
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
                            socket.broadcast.emit('user.disconnect', null, data);
                        })
                        .fail(function(err){
                            winston.error(err.stack || err);
                        });
                }
            });

            socket.on('*', function(payload){
                if(!payload || !payload.data) return;

                var eventName = payload.data.shift();
                var args = payload.data.shift();
                var callback = payload.data.shift();

                //user just provide callback only
                if (!callback) {
                    callback = args;
                    args = null;
                }

                if (!eventName || !callback || ! (typeof(callback) == "function")) {
                    return;
                }

                var parts = eventName.toString().split('.'),
                    namespace = parts.slice(0, 1),
                    methodToCall = parts.reduce(function(prev, cur) {
                        if (prev !== null && prev[cur]) {
                            return prev[cur];
                        } else {
                            return null;
                        }
                    }, routeNamespaces);

                if(!methodToCall) {
                    return winston.warn('[socket.io] Unrecognized message: ' + eventName);
                }

                if(socket.uid) {
                    SocketModules.User.updateLastOnlineTime(socket.uid);
                }

                //call the method
                methodToCall.call(null, socket, args ? args : null, function(err, result) {
                    callback && callback(err?{error: (err.stack || err.error || err)}:null, result);
                });
            })
        });
    }
}(exports));