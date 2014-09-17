'use strict';

(function(module) {
    var Q                   = require("q");
    var async               = require("async");
    var beaver              = require("../../Beaver.js");

    module.find = function(req, res)
    {
        if(!req.session || !req.session.user)
        {
            return res.error("User session not found");
        }

        if(!req.param.id)
        {
            //TODO: return only location accessible by that user
            Q(beaver.sequelizeModels.Location.getFullTree())
                .then(function(data){
                    res.success(data);
                })
                .fail(function(err){
                    res.error(err);
                });

        }
        else
        {
            Q(beaver.sequelizeModels.Location.find({where: {id: req.param.id}}))
                .then(function(location){
                    if(!location)
                    {
                        return Q.reject({
                            error: "Location with id = " + req.param.id + " not found"
                        })
                    }
                    else
                    {
                        return res.success(location);
                    }
                })
                .fail(function(err){
                    return res.error(err);
                })
        }
    }

    module.create = function(req, res)
    {
        if(!req.session || !req.session.user)
        {
            return res.error("User session not found");
        }

        //create new locations
        req.assert('parentId').notEmpty().isInt();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        Q(beaver.sequelizeModels.Location.addTreeNode(req.parentId, req.body))
            .then(function(newLocation){
                res.success(newLocation);
            })
            .fail(function(err){
                return res.err(err);
            })
    }

    module.update = function(req, res)
    {
        if(!req.session || !req.session.user)
        {
            return res.error("User session not found");
        }

        Q(beaver.sequelizeModels.Location.update(req.body))
            .then(function(){
                res.success();
            })
            .fail(function(err){
                return res.error(err);
            })
    }

    module.destroy = function(req, res)
    {
        if(!req.session || !req.session.user)
        {
            return res.error("User session not found");
        }

        Q(beaver.sequelizeModels.Location.removeTreeNode(req.param.id))
            .then(function(newLocation){
                res.success();
            })
            .fail(function(err){
                return res.error(err);
            })
    }
}(exports));