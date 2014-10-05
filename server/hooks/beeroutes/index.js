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
    var middleWareFactory   = require("./middleware.js");

    module = module || {};

    //implicit bind all controller action
    module._bindController = function(beaver)
    {
        try
        {
            beaver.controllers = {};

            //process controllers
            _.each(beaver.controllerFunctions, function(controller, controllerId){
                _.each(controller, function(action, actionId){
                    if (_.isString(action) || _.isBoolean(action) || !_.isFunction(action))
                    {
                        return;
                    }

                    var injectedMiddlewares = [];
                    if(beaver.controllerFunctions[controllerId]._middlewares && beaver.controllerFunctions[controllerId]._middlewares[actionId])
                    {
                        injectedMiddlewares = beaver.controllerFunctions[controllerId]._middlewares[actionId];
                    }


                    beaver.controllers[controllerId] = beaver.controllers[controllerId] || {};
                    actionId = actionId.toLowerCase();
                    beaver.controllers[controllerId][actionId] = action;

                    //implicitly bind the route -- default map-all
                    beaver.emit("router:bind", {
                        middlewares: injectedMiddlewares || [],
                        path: beaver.config.controllers.uri.prefix + "/" + controllerId + "/" + actionId,
                        target: beaver.controllers[controllerId][actionId]
                    });
                });
            });
        }
        catch(e)
        {
            beaver.winston.error("[ERROR]:" + e.stack || e);
        }
    }

    //bind additional REST route, etc... if controller has corresponding sequelize models
    module._bindBeeRoute = function(beaver)
    {
        function bindRoute(route)
        {
            //this emit route for the laten router to pickup
            beaver.emit("router:bind", route);
        }

        try
        {
            var beeRouteFactory = new middleWareFactory(beaver);

            //loop through controller with model prefix such as: UserController
            //controller: action function such as UserController.find; controllerId: User
            _.each(beaver.controllers, function(controller, controllerId){
                var sequelizeModel = beeRouteFactory.matchModelNameIgnoreCase(controllerId);
                if(!sequelizeModel) return;

                //TODO: only bind one which don't have explicit beeRoute bound
                //bind restful route implicitly
                var baseRoute = beaver.config.controllers.uri.prefix + "/" + controllerId;

                //bind all routes
                bindRoute({
                    method: 'get',
                    path: baseRoute,
                    target: beeRouteFactory.find(sequelizeModel),
                    routeType: "Bee Route"
                });

                bindRoute({
                    method: 'get',
                    path: baseRoute+"/:id(\\d+)",
                    target: beeRouteFactory.findOne(sequelizeModel),
                    routeType: "Bee Route"
                });

                bindRoute({
                    method: 'post',
                    path: baseRoute,
                    target: beeRouteFactory.create(sequelizeModel),
                    routeType: "Bee Route"
                });

                bindRoute({
                    method: 'put',
                    path: baseRoute+"/:id(\\d+)",
                    target: beeRouteFactory.update(sequelizeModel),
                    routeType: "Bee Route"
                });

                bindRoute({
                    method: 'post',
                    path: baseRoute+"/:id(\\d+)",
                    target: beeRouteFactory.update(sequelizeModel),
                    routeType: "Bee Route"
                });

                bindRoute({
                    method: 'delete',
                    path: baseRoute+"/:id(\\d+)",
                    target: beeRouteFactory.destroy(sequelizeModel),
                    routeType: "Bee Route"
                });
            });
        }
        catch(e)
        {
            beaver.winston.error("[ERROR]:" + e.stack || e);
        }
    }

    //init function
    module.init = function(beaver, callback) {
        beaver = beaver || {};

        //bind controller
        module._bindController(beaver);
        module._bindBeeRoute(beaver);

        callback && callback();
    }
}(exports));