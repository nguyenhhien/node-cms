var express             = require('express');
var bcrypt 		        = require("bcrypt");
var models              = require("../models");
var mongooseModel       = require('../mongoose');
var Q                   = require("q");
var async               = require("async");
var utils               = require("../helpers/Utils.js");
var Email               = require("../modules/email");
var request 	        = require("request");
var _                   = require('lodash-node');
var Chance              = require('chance'),
    chance              = new Chance();
var                     dateFormat = require('dateformat');
var Utils               = require("../helpers/Utils.js");

var router = express.Router();

//create new or update
router.post("/comments", function(req, res){
    if(!req.session || !req.session.user)
    {
        return res.error("User session not found");
    }

    req.assert('discussionId').notEmpty().isInt();
    req.assert('discussionName').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    var newComment = req.body;

    var parentSlug = newComment.parent && newComment.parent.slug,
        parentFullSlug = newComment.parent && newComment.parent.fullSlug;

    //generate random slug -- avoid special character [ cause regex escape in V8 got error (\\[)
    var now = new Date(),
        slug = chance.string({alpha: true, length: 4}),
        fullSlug = dateFormat(now, "yyyy.mm.dd.hh.MM.ss") + ":" + slug;

    //append parent slug into this slug
    if(parentSlug && parentFullSlug)
    {
        slug = parentSlug + "/" + slug;
        fullSlug = parentFullSlug + "/" + fullSlug;
    }

    //store the user information
    var savedComment = _.extend(req.body, {
        posted: now,
        slug: slug,
        fullSlug: fullSlug,
        parentId: newComment.parent && newComment.parent._id,
        parent: newComment.parent && newComment.parent._id,
        author: {
            id: req.session.user.id,
            name: req.session.user.name,
            email: req.session.user.email,
            avatar: req.session.user.avatar
        }
    });

    //create comments
    mongooseModel.Comment.createQ(savedComment)
        .then(function(comment){
            return res.success(comment);
        })
        .fail(function(err){
            return res.error(err);
        })
});

//get list of comments -- sorted by thereading style
router.get("/comments", function(req, res){
    req.assert('discussionId').notEmpty().isInt();
    req.assert('discussionName').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    //get all comments for a certain discussion_id, discussion name
    var limit = req.query.limit,
        offset = req.query.offset;

    //return pagination data -- thread comments
    if(limit != null && offset != null)
    {
        Q.all([
                mongooseModel.Comment
                    .find()
                    .where('discussionId', req.param('discussionId'))
                    .where('discussionName', req.param('discussionName'))
                    .skip(offset)
                    .limit(limit)
                    .sort({'full_slug': -1})
                    .execQ(),
                mongooseModel.Comment.count()
                    .where('discussionId', req.param('discussionId'))
                    .where('discussionName', req.param('discussionName'))
                    .execQ()
            ])
            .spread(function(comments, count){
                return res.success({
                    count: count,
                    rows: comments
                });
            })
            .fail(function(err){
                return res.error(err);
            })
            .done();
    }
    else
    {
        mongooseModel.Comment
            .find()
            .where('discussionId', req.param('discussionId'))
            .where('discussionName', req.param('discussionName'))
            .sort({'full_slug': -1})
            .execQ()
            .then(function(comments){
                return res.success(comments);
            })
            .fail(function(err){
                return res.error(err);
            })
            .done();
    }
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

    mongooseModel.Comment.findOneAndUpdateQ({_id: commentId, 'author.id': req.session.user.id}, req.body)
        .then(function(newComment){
            if(!newComment || !newComment.id) return res.error("Comment is not found or does not belong to the user");

            return res.success(newComment);
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

    //find and remove all child reply + comment
    mongooseModel.Comment
        .where('_id', commentId)
        .where('author.id', req.session.user.id)
        .execQ()
        .then(function(comments){
            if(comments.length == 0)
                return Q.reject("Comment with id = " + commentId + " not found in the system");

            var comment = comments[0];

            //remove comments
            return mongooseModel.Comment.removeQ({
                    discussionId: comment.discussionId,
                    discussionName: comment.discussionName,
                    fullSlug: new RegExp('^'+ Utils.regexEscape(comment.fullSlug))
                })
        })
        .then(function(){
            res.success();
        })
        .fail(function(err){
            return res.error(err);
        })

});

module.exports = router;
