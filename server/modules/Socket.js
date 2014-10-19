'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');
    var beaver              = require("../../Beaver.js");

    module.getUserSocketIds = function(userId)
    {
        var deferred = Q.defer();

        Q.async(
            function*(){
                var key = "socket:" + userId;
                var socketIds = yield Q.denodeify(beaver.redis.getSetMembers)(key);
                deferred.resolve(socketIds);
            })()
            .fail(function(error){
                deferred.reject(error);
            });

        return deferred.promise;
    }

    //get list of socketIds from list of userIds in redis
    module.getUsersSocketIds = function(userIds)
    {
        var deferred = Q.defer();

        var tasks = [];
        _.forEach(userIds || [], function(userId){
            tasks.push(module.getUserSocketIds(userId));
        });

        Q.async(
            function*(){
                var a = yield Q.all(tasks);
                var outIds = [];
                _.forEach(a, function(elem){
                    if(elem && _.isArray(elem))
                    {
                        outIds = outIds.concat(elem);
                    }
                });

                deferred.resolve(outIds);
            })()
            .fail(function(error){
                deferred.reject(error);
            });

        return deferred.promise;
    }

    module.getUserInConversation = function(conversationId)
    {
        var deferred = Q.defer();

        Q.async(
            function*(){
                var conversation = yield beaver.models.mongoose.Conversation
                    .find()
                    .where('_id', conversationId)
                    .lean()
                    .execQ();

                if(!conversation || !conversation.length)
                {
                    return deferred.reject("the conversation does not exist");
                }

                //get user id in this conversation
                var userIds = _.chain(conversation[0].users || [])
                    .map(function(elem){
                        return elem.id;
                    })
                    .map(function(elem){
                        return _.parseInt(elem);
                    })
                    .filter(function(elem){
                        return (!_.isNaN(elem));
                    })
                    .value();

                deferred.resolve({
                    users: conversation[0].users,
                    userIds: userIds
                });
            })()
            .fail(function(error){
                deferred.reject(error);
            });

        return deferred.promise;
    }

}(exports));