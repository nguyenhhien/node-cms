'use strict';

(function(module) {
    var Q                   = require("q");
    var async               = require("async");
    var beaver              = require("../../Beaver.js");

    module.find = function(req, res)
    {
        req.assert('objectId').notEmpty().isInt();
        req.assert('collectionName').notEmpty();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        //get all comments for a certain discussion_id, discussion name
        var limit = req.query.limit,
            offset = req.query.offset;

        beaver.modules.Comment.getComments(req.param('objectId'), req.param('collectionName'), limit, offset)
            .then(function(response){
                res.success(response);
            })
            .fail(function(err){
                res.error(err);
            });
    }

    module.create = function(req, res)
    {
        if(!req.session || !req.session.user)
        {
            return res.error("User session not found");
        }

        req.assert('objectId').notEmpty().isInt();
        req.assert('collectionName').notEmpty();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        beaver.modules.Comment.createNewComment(req.param('objectId'), req.param('collectionName'), req.body, req.session.user)
            .then(function(comment){
                return res.success(comment);
            })
            .fail(function(err){
                return res.error(err);
            });
    }

    module.update = function(req, res)
    {
        if(!req.session || !req.session.user)
        {
            return res.error("User session not found");
        }

        //get the id of comments
        var commentId = req.param("id");

        //updated timestamp
        req.body.updated = new Date();

        beaver.modules.Comment.updateComment(commentId, req.session.user.id, req.body)
            .then(function(newComment){
                res.success(newComment);
            })
            .fail(function(err){
                return res.error(err);
            });
    }

    module.destroy = function(req, res)
    {
        if(!req.session || !req.session.user)
        {
            return res.error("User session not found");
        }

        //get the id of comments
        var commentId = req.param("id");

        beaver.modules.Comment.deleteComment(commentId, req.session.user.id)
            .then(function(){
                res.success();
            })
            .fail(function(err){
                return res.error(err);
            });
    }

    //setting for uri bind
    module._config = {
        actions: false,
        shortcuts: false,
        rest: false
    }
}(exports));