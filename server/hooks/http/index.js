'use strict';

//load config files
(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');
    var express             = require('express');
    var http				= require("http");
    var middleware          = require("./middleware.js");

    module = module || {};

    //init function
    module.init = function(beaver, callback) {
        beaver = beaver || {};
        beaver.hooks = beaver.hooks || {};
        beaver.hooks.http = beaver.hooks.http || {};

        //create app & http server
        //TODO: specify for http && https -- or using nginx for reverse proxy
        var app = beaver.hooks.http.app = express();
        var latentApp = beaver.hooks.http.latentApp = express();

        app.enabled('trust proxy');
        app.enable("jsonp callback");

        var server = beaver.hooks.http.server = http.Server(app);

        //load some default middleware
        var defaultMiddlewares = middleware.getDefaultMiddleware(beaver);

        //TODO: loop by using middleware order in config files and inject custom middleware
        Object.keys(defaultMiddlewares).forEach(function(key){
            app.use(defaultMiddlewares[key]);
        });

        //manual bind route
        beaver.on('router:bind', function(route) {
            route = _.cloneDeep(route);

            try
            {
                app[route.method || 'all'](route.path, route.target);
                latentApp[route.method || 'all'](route.path, route.target);
                //beaver.winston.info("[Route Bound]: " + route.path);
            }
            catch(e)
            {
                beaver.winston.error("[Route]" + JSON.stringify(route, null, 2) + ":" + e.stack || e);
            }
        });

        //unbind route -- TODO: check method also
        beaver.on('router:unbind', function(route) {
            var newRoutes = [];
            app._router.stack = app._router.stack.filter(function(elem){
                if(elem.route && elem.route.path == route.path)
                {
                    return false;
                }
                else return true;
            });
        });

        //TODO: add cluster support
        beaver.on('ready', function(callback){
            server.listen(beaver.config.global.port, function(err)
            {
                beaver.winston.info("Web server process listening on %s:%d ", beaver.config.global.port);
                beaver.emit('hook:http:listening');
                callback && callback(err);
            });
        });

        //forward to latent express
        //TODO: check unmatched route
        beaver.on("socket:request", function(req, res){
            latentApp.handle(req, res);
        });

        callback && callback();
    }

    module.close = function(beaver)
    {
        if(beaver.hooks.http.server)
        {
            beaver.hooks.http.server.close();
        }
    }
}(exports));