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

            app[route.verb || 'all'](route.path, route.target);
        });

        //unbind route
        beaver.on('router:unbind', function(route) {
            var newRoutes = [];
            _.each(app.routes[route.method], function(expressRoute) {
                if (expressRoute.path != route.path) {
                    newRoutes.push(expressRoute);
                }
            });
            app.routes[route.method] = newRoutes;
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