'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var	SocketIO            = require('socket.io');
    var cookie              = require('cookie')
    var cookieParser        = require("cookie-parser");
    var fs                  = require('fs');
    var async               = require('async');

    var mockRequest         = require("./request.js");
    var mockResponse        = require("./response.js");

    module.init = function(beaver, callback)
    {
        var io = SocketIO(beaver.hooks.http.server);

        io.set("transports", ['websocket', 'xhr-polling', 'jsonp-polling', 'flashsocket']);

        //session store -- specifically for socket.io > 1.0
        io.adapter(require('socket.io-redis')({
            host: beaver.config.adapters.Redis.host,
            port: beaver.config.adapters.Redis.port
        }));

        var socketioWildcard    = require('socketio-wildcard')();
        io.use(socketioWildcard);

        module.io = io;

        //authorize the connection
        io.use(function(socket, next) {
            var hsData = socket.request;
            var hsCookie = hsData.headers.cookie || (hsData._query && hsData._query['cookie']);

            var parsedCookie;

            Q.async(
                function*(){
                    if (hsCookie)
                    {
                        parsedCookie = cookie.parse(hsCookie);

                        if(!parsedCookie || !parsedCookie['sid'])
                        {
                            return Q.reject('[socket.io] cookie session not found');
                        }

                        hsData.sessionID = cookieParser.signedCookie(parsedCookie['sid'],
                            beaver.config.global.sessionSecret);

                        if (parsedCookie['sid'] == hsData.sessionID)
                        {
                            return Q.reject('[socket.io] cookie is invalid.');
                        }
                    }
                    else
                    {
                        beaver.winston.info("no cookies being sent");
                        return Q.reject('[socket.io] no cookie transmitted.');
                    }

                    var session = yield Q.denodeify(beaver.redis.get)("sess:" + hsData.sessionID);

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
                    beaver.winston.info("[socket.io] ERROR: ", error.stack || error);
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

                Q.async(
                    function*(){
                        yield Q.denodeify(beaver.redis.setObject)("user:" + socket.uid, sessionUser);
                        yield Q.denodeify(beaver.redis.sortedSetAdd)("users:online", Date.now(), socket.uid);

                        beaver.winston.info("[socket.io] client connected", socket.uid);

                        socket.emit('event:connect', {
                            status: 'online',
                            name: hs.session && hs.session.user.name,
                            avatar: hs.session && hs.session.user.avatar,
                            id: hs.session && hs.session.user.id
                        });

                        //broadcast event to other connected sockets?
                        socket.broadcast.emit('user.isOnline', null, {
                            status: 'online',
                            name: hs.session && hs.session.user.name,
                            avatar: hs.session && hs.session.user.avatar,
                            id: hs.session && hs.session.user.id
                        });
                    })()
                    .fail(function(error){
                        beaver.winston.error(error.stack || error);
                    });
            }

            socket.on('disconnect', function() {
                Q.denodeify(beaver.redis.sortedSetRemove)("users:online", socket.uid)
                    .then(function(){
                        //need this -- because users can use multiple client to connect
                        beaver.winston.info("[socket.io] client disconnected");
                    })
                    .then(function(data){
                        socket.broadcast.emit('user.disconnect', null, {id: socket.uid});
                    })
                    .fail(function(err){
                        beaver.winston.error(err.stack || err);
                    });
            });

            socket.on('*', function(payload){
                if(!payload || !payload.data) return;

                var path = payload.data.shift();
                var body = payload.data.shift();
                var callback = payload.data.shift();

                //user just provide callback only
                if (!callback) {
                    callback = body;
                    body = null;
                }

                if (!path || !callback || ! (typeof(callback) == "function")) {
                    return;
                }

                console.log("[socket.io] request receive", path, body);

                //forward request to latent express
                var req = mockRequest({
                    method: body.method || "GET",
                    url: path,
                    body: body.data || {}
                });

                var res = mockResponse({
                    eventEmitter: require('events').EventEmitter
                });

                res.on("end", function(){
                    //TODO: check the case of error?
                    callback && callback(null, res._getData());
                });

                beaver.emit("socket:request", req, res);
            });
        });

        callback && callback();
    };
}(exports));