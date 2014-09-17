var express             = require('express');
var mongoose            = require('../database/mongoose.js');
var Q                   = require("q");
var async               = require("async");
var utils               = require("../helpers/Utils.js");
var Email               = require("../modules/email");
var request 	        = require("request");
var _                   = require('lodash-node');
var Chance              = require('chance');
var chance              = new Chance();
var dateFormat          = require('dateformat');
var Utils               = require("../helpers/Utils.js");
var modules             = require("../modules/index.js");

var router = express.Router();

//create new or update
router.post("/comments", function(req, res){
    if(!req.session || !req.session.user)
    {
        return res.error("User session not found");
    }

    req.assert('objectId').notEmpty().isInt();
    req.assert('collectionName').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    modules.Comment.createNewComment(req.param('objectId'), req.param('collectionName'), req.body, req.session.user)
        .then(function(comment){
            return res.success(comment);
        })
        .fail(function(err){
            return res.error(err);
        })
});

//get list of comments -- sorted by thereading style
router.get("/comments", function(req, res){
    req.assert('objectId').notEmpty().isInt();
    req.assert('collectionName').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    //get all comments for a certain discussion_id, discussion name
    var limit = req.query.limit,
        offset = req.query.offset;

    modules.Comment.getComments(req.param('objectId'), req.param('collectionName'), limit, offset)
        .then(function(response){
            res.success(response);
        })
        .fail(function(err){
            res.error(err);
        })
});

//update comments -- using post because it's not idempotent
router.post("/comments/:id", function(req, res){
    if(!req.session || !req.session.user)
    {
        return res.error("User session not found");
    }

    //get the id of comments
    var commentId = req.param("id");

    //updated timestamp
    req.body.updated = new Date();

    modules.Comment.updateComment(commentId, req.session.user.id, req.body)
        .success(function(newComment){
            res.success(newComment);
        })
        .fail(function(err){
            return res.error(err);
        })
});

//remove comments
router.delete("/comments/:id", function(req, res){
    if(!req.session || !req.session.user)
    {
        return res.error("User session not found");
    }

    //get the id of comments
    var commentId = req.param("id");

    modules.Comment.deleteComment(commentId, req.session.user.id)
        .then(function(){
            res.success();
        })
        .fail(function(err){
            return res.error(err);
        })

});

module.exports = router;
