'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');
    var Chance              = require('chance');
    var chance              = new Chance();
    var dateFormat          = require('dateformat');
    var Utils               = require("../helpers/Utils.js");
    var mongoose            = require('../database/mongoose.js');

    //create new comments
    module.createNewComment = function(objectId, collectionname, newComment, postedUser)
    {
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
        var savedComment = _.extend(newComment, {
            posted: now,
            slug: slug,
            fullSlug: fullSlug,
            parentId: newComment.parent && newComment.parent._id,
            parent: newComment.parent && newComment.parent._id,
            author: {
                id: postedUser.id,
                name: postedUser.name,
                email: postedUser.email,
                avatar: postedUser.avatar
            }
        });

        //create comments
        return mongoose.models.Comment.createQ(savedComment); 
    };

    //get comments
    module.getComments = function(objectId, collectionname, limit, offset)
    {
        //return pagination data -- thread comments
        if(limit != null && offset != null)
        {
            return Q.all([
                    mongoose.models.Comment
                        .find()
                        .where('objectId', objectId)
                        .where('collectionName', collectionname)
                        .skip(offset)
                        .limit(limit)
                        .sort({'full_slug': -1})
                        .lean()
                        .execQ(),
                    mongoose.models.Comment.count()
                        .where('objectId', objectId)
                        .where('collectionName', collectionname)
                        .execQ()
                ])
                .spread(function(comments, count){
                    return Q.resolve({
                        count: count,
                        rows: comments
                    });
                })
                .fail(function(err){
                    return Q.reject(err);
                });
        }
        else
        {
            return mongoose.models.Comment
                .find()
                .where('objectId', objectId)
                .where('collectionName', collectionname)
                .sort({'full_slug': -1})
                .lean()
                .execQ()
                .then(function(comments){
                    return Q.resolve(comments);
                })
                .fail(function(err){
                    return Q.reject(err);
                });
        }
    };

    module.updateComment = function(commentId, userId, newComment)
    {
        return mongoose.models.Comment
            .findOneAndUpdate({_id: commentId, 'author.id': req.session.user.id}, newComment)
            .lean()
            .execQ()
            .then(function(newComment){
                if(!newComment || !newComment.id) return Q.reject("Comment is not found or does not belong to the user");
                return Q.resolve(newComment);
            });
    };

    module.deleteComment = function(commentId, userId)
    {
        //find and remove all child reply + comment
        return mongoose.models.Comment
            .where('_id', commentId)
            .where('author.id', userId)
            .lean()
            .execQ()
            .then(function(comments){
                if(comments.length == 0)
                    return Q.reject("Comment with id = " + commentId + " not found in the system");

                var comment = comments[0];

                //remove comments
                return mongoose.models.Comment.removeQ({
                    objectId: comment.objectId,
                    collectionName: comment.collectionName,
                    fullSlug: new RegExp('^'+ Utils.regexEscape(comment.fullSlug))
                })
            });
    };

}(exports));