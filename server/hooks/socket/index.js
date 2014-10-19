'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var	SocketIO            = require('socket.io');
    var cookie              = require('cookie')
    var cookieParser        = require("cookie-parser");
    var fs                  = require('fs');
    var async               = require('async');
    var _                   = require('lodash-node');
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
                        //console.log("beaver config", beaver.config.global.sessionSecret);
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

            var userInfo = {
                status: 'online',
                name: hs.session && hs.session.user.name,
                avatar: hs.session && hs.session.user.avatar,
                id: hs.session && hs.session.user.id
            };

            //for now, we don't allow anonymous login
            if(socket.uid)
            {
                var sessionUser = hs.session.user;
                sessionUser.status = 'online';

                Q.async(
                    function*(){
                        //need to saved all socket.id in redis so that we can scale to multiple servers/processes
                        var key = "socket:" + socket.uid;
                        yield Q.denodeify(beaver.redis.setAdd)(key, socket.id);

                        //also save user info; and list of online user in redis
                        yield Q.denodeify(beaver.redis.setObject)("user:" + socket.uid, sessionUser);
                        yield Q.denodeify(beaver.redis.sortedSetAdd)("users:online", Date.now(), socket.uid);

                        beaver.winston.info("[socket.io] client connected", socket.uid);

                        //emit connect event to this socket
                        socket.emit('event:connect', _.extend({status: 'online'}, userInfo));

                        //broadcast event to all other connected sockets
                        socket.broadcast.emit('user.changeStatus', null,  _.extend({status: 'online'}, userInfo));
                    })()
                    .fail(function(error){
                        beaver.winston.error(error.stack || error);
                    });
            }

            socket.on('disconnect', function() {
                Q.async(
                    function*(){
                        yield Q.denodeify(beaver.redis.sortedSetRemove)("users:online", socket.uid);
                        var key = "socket:" + socket.uid;
                        yield Q.denodeify(beaver.redis.setRemove)(key, socket.id);

                        //check if there is any connected client; if not; throw offline status
                        var count = yield Q.denodeify(beaver.redis.setCount)(key);
                        if(!count)
                        {
                            //broadcast event to all other connected sockets
                            socket.broadcast.emit('user.changeStatus', null, _.extend({status: 'offline'}, userInfo));

                            beaver.redis.delete("user:" + socket.uid);
                        }

                        //need this -- because users can use multiple client to connect
                        beaver.winston.info("[socket.io] client disconnected");

                        socket.broadcast.emit('user.disconnect', null, {id: socket.uid});
                    })()
                    .fail(function(error){
                        beaver.winston.error(error.stack || error);
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

                req.io = io;
                req.socket = socket;
                req.session.user = sessionUser;

                res.on("end", function(){
                    if(res.statusCode != 200)
                    {
                        //error happen
                        callback && callback(res._getData());
                    }
                    else
                    {
                        //everything is fine
                        callback && callback(null, res._getData());
                    }
                });

                beaver.emit("socket:request", req, res);
            });
        });

        callback && callback();
    };
}(exports));