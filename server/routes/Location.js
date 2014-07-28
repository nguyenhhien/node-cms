var express             = require('express');
var Q                   = require("q");
var async               = require("async");
var request 	        = require("request");
var _                   = require('lodash-node');
var dateFormat          = require('dateformat');

var sequelize           = require("../database/sequelize.js");
var utils               = require("../helpers/Utils.js");

var router = express.Router();

//create new or update
router.post("/locations", function(req, res){
    if(!req.session || !req.session.user)
    {
        return res.error("User session not found");
    }

    //create new locations
    req.assert('parentId').notEmpty().isInt();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q(sequelize.models.Location.addTreeNode(req.parentId, req.body))
        .then(function(newLocation){
            res.success(newLocation);
        })
        .fail(function(err){
            return res.err(err);
        })
});

//get list of location
router.get("/locations", function(req, res){
    if(!req.session || !req.session.user)
    {
        return res.error("User session not found");
    }

    //TODO: return only location accessible by that user
    Q(sequelize.models.Location.getFullTree())
        .then(function(data){
            res.success(data);
        })
        .fail(function(err){
            res.error(err);
        });
});

//get location with id
router.get("/locations/:id", function(req, res){
    if(!req.session || !req.session.user)
    {
        return res.error("User session not found");
    }

    Q(sequelize.models.Location.find({where: {id: req.param.id}}))
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
});


//update location -- using post because it's not idempotent
router.post("/locations/:id", function(req, res){
    if(!req.session || !req.session.user)
    {
        return res.error("User session not found");
    }

    Q(sequelize.models.Location.update(req.body))
        .then(function(){
            res.success();
        })
        .fail(function(err){
            return res.error(err);
        })
});

//remove location
router.delete("/locations/:id", function(req, res){
    if(!req.session || !req.session.user)
    {
        return res.error("User session not found");
    }

    Q(sequelize.models.Location.removeTreeNode(req.param.id))
        .then(function(newLocation){
            res.success();
        })
        .fail(function(err){
            return res.error(err);
        })
});

module.exports = router;