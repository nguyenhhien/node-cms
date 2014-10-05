'use strict';

//default and load middleware
(function(module) {
    var express             = require('express');
    var session             = require('express-session');
    var RedisStore          = require('connect-redis')(session);
    var expressValidator    = require('express-validator');
    var _                   = require('lodash-node');
    var gzippo              = require('gzippo');

    module.getDefaultMiddleware = function(beaver)
    {
        beaver.config = beaver.config || {};
        beaver.config.http  = beaver.config.http || {};

        return _.defaults(beaver.config.http.middleware || {}, {
            www: (function(){
                //TODO: add gzippo compress
                return express['static'](beaver.config.global.paths['public'], {
                    maxAge: beaver.config.global.cache.maxAge
                });
            })(),
            session: (function() {
                if (beaver.config.adapters && beaver.config.adapters.Redis) {
                    return session({
                        key: 'sid',
                        store:  new RedisStore({
                            host: 	beaver.config.adapters.Redis.host,
                            port:	beaver.config.adapters.Redis.port,
                            db:		beaver.config.adapters.Redis.db,
                            pass:	beaver.config.adapters.Redis.pass
                        }),
                        maxAge: beaver.config.global.cache.maxAge,
                        secret: beaver.config.global.sessionSecret
                    })
                }
            })(),
            cookieParser: (function(){
                return require("cookie-parser")();
            })(),
            bodyParser: (function(){
                //multipart upload has been moved to another middleware
                return require("body-parser")({ uploadDir: beaver.config.global.uploadsFolder})
            })(),
            expressValidator: (function(){
                return expressValidator({
                    errorFormatter: function(param, msg, value) {
                        var namespace = param.split('.')
                            , root    = namespace.shift()
                            , formParam = root;

                        while(namespace.length) {
                            formParam += '[' + namespace.shift() + ']';
                        }
                        return {
                            param : formParam,
                            msg   : msg,
                            value : value
                        };
                    }
                })
            })(),
            cors: (function(){
                return function(req, res, next)
                {
                    //TODO: using config to determine cors
                    res.header('Access-Control-Allow-Origin', req.get('origin')); //allow CORS
                    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                    res.header('Access-Control-Allow-Headers', 'Content-Type');
                    res.header('Access-Control-Allow-Credentials', true); //allow CORS

                    next();
                }
            })(),
            poweredBy: function xPoweredBy(req, res, next) {
                res.header('X-Powered-By', 'Beaver <Beaver.js>');
                next();
            },
            //TODO: remove next() -- proper emit
            404: function handleUnmatchedRequest(req, res, next) {
                beaver.emit('router:request:404', req, res);
                next();
            },
            500: function handleError(err, req, res, next) {
                beaver.emit('router:request:500', err, req, res);
                next();
            }
        });
    }
}(exports));