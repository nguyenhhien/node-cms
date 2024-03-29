'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');
    var beaver              = require("../../Beaver.js");

    //find existing conversation
    module.findExistingConversation = function(users)
    {
        var userIds = _.chain(users)
            .sortBy('id')
            .map(function(elem){
                return elem.id;
            })
            .value()
            .join(",");


        return beaver.models.mongoose.Conversation
            .find()
            .where('userIds', userIds)
            .lean()
            .execQ();
    }

    //create new conversation and add existing user into list
    module.createNewConversation = function(users)
    {
        users.forEach(function(user){
            user.joinedDate = new Date();
        });

        var userIds = _.chain(users)
            .sortBy('id')
            .map(function(elem){
                return elem.id;
            })
            .value()
            .join(",");

        return beaver.models.mongoose.Conversation
            .createQ({
                numPages: 1,
                users: users,
                userIds: userIds
            });
    }

    //add new user into conversation
    module.addUserIntoConversation = function(conversationId, user)
    {
        var deferred = Q.defer();

        Q.async(
            function*(){
                var conversation = yield beaver.models.mongoose.Conversation
                    .find()
                    .where('_id', conversationId)
                    .where('users.id').in([user.id])
                    .lean()
                    .execQ();

                var userIds = conversation.userIds;

                if(userIds && _.isString(userIds))
                {
                    userIds = _.chain(_.uniq(userIds.split(',')))
                        .map(function(elem){
                            return _.parseInt(elem);
                        })
                        .filter(function(elem){
                            return (!_.isNaN(elem)) && (elem != user.id);
                        })
                        .push(user.id)
                        .sort().value().join(",");
                }

                if(!conversation.length)
                {
                    //push user into existing array
                    yield beaver.models.mongoose.Conversation
                        .update({
                            _id: conversationId
                        },
                        {
                            $push:
                            {
                                users: user
                            },
                            $set:
                            {
                                userIds: userIds || ""
                            }
                        })
                        .execQ();
                }

                deferred.resolve();
            })()
            .fail(function(error){
                deferred.reject(error);
            });

        return deferred.promise;
    }

    //remove user from conversation
    module.removeUserFromConversation = function(conversationId, userId)
    {
        var deferred = Q.defer();

        Q.async(
            function*(){
                var conversation = yield beaver.models.mongoose.Conversation
                    .find()
                    .where('_id', conversationId)
                    .lean()
                    .execQ();

                var userIds = conversation.userIds;
                if(userIds && _.isString(userIds))
                {
                    userIds = _.chain(_.uniq(userIds.split(',')))
                        .map(function(elem){
                            return _.parseInt(elem);
                        })
                        .filter(function(elem){
                            return (!_.isNaN(elem)) && (elem != userId);
                        })
                        .sort().value().join(",");
                }

                //remove user from the list
                yield beaver.models.mongoose.Conversation
                    .update({
                        _id: conversationId
                    },
                    {
                        $pull:
                        {
                            users: {
                                id: userId
                            }
                        },
                        $set:
                        {
                            userIds: userIds || ""
                        }
                    })
                    .execQ();

                deferred.resolve();
            })()
            .fail(function(error){
                deferred.reject(error);
            });

        return deferred.promise;
    }

    //delete a certain message inside the array
    module.deleteMessage = function(conversationId, page, userId, messageId)
    {
        return beaver.models.mongoose.ConversationPage
            .update({
                conversationId: conversationId,
                page: page,
                'messages._id': messageId,
                'messages.userId': userId
            },
            {
                $set: {
                    'messages.$.isDeleted': 1
                }
            })
            .execQ();
    }

    //add new message into list
    module.addMessage = function(conversationId, userId, content)
    {
        return beaver.models.mongoose.Conversation
            .find()
            .where('_id', conversationId)
            .where('users.id').in([userId])
            .lean()
            .execQ()
            .then(function(conversation){
                if(!conversation || !conversation.length)
                {
                    return Q.reject("Conversation not found or user doesn't involve in the conversation");
                }

                return [
                    conversation,
                    beaver.models.mongoose.ConversationPage.findOneAndUpdate({
                        conversationId: conversationId,
                        page: conversation[0].numPages
                    },
                    {
                        '$inc':
                        {
                            'count': 1
                        },
                        '$push':
                        {
                            messages: {
                                userId: userId,
                                postedDate: new Date(),
                                content: content,
                                page: conversation[0].numPages
                            }
                        }
                    },
                    {
                        new: true, upsert: true, fields: {count:1}
                    }).lean().execQ()
                ]
            })
            .spread(function(conversation, conversationPage)
            {
                //increase number of pages
                if(conversationPage.count >= (beaver.config.global.chatPageSize || 100))
                {
                    return beaver.models.mongoose.Conversation
                        .findOneAndUpdate({
                            _id: conversationId,
                            numPages: conversation[0].numPages
                        },
                        {
                            '$inc': { 'numPages': 1 }
                        })
                        .lean()
                        .execQ();

                }
                else return Q();
            });
    }

    //load nMessage before current message
    module.loadPreviousMessages = function(conversationId, currentMessage)
    {
        var deferred = Q.defer();

        //NOTE: to reduce load, we always load the full page
        //and remaining messages if any from the page of current message
        Q.async(
            function*(){
                var page;

                if(currentMessage)
                {
                    page = currentMessage.page;
                }
                else
                {
                    //otherwise; just loaded latest page
                    var conversation = yield beaver.models.mongoose.Conversation
                        .find()
                        .where('_id', conversationId)
                        .lean()
                        .execQ();

                    if(conversation && conversation.length)
                    {
                        page = conversation[0].numPages;
                    }
                    else
                    {
                        page = -1;
                    }
                }

                //load that page
                var loadedPages = yield beaver.models.mongoose.ConversationPage
                    .find()
                    .where('conversationId', conversationId)
                    .where('page').gte(page-1)
                    .where('page').lte(page)
                    .lean()
                    .execQ();

                loadedPages = _.sortBy(loadedPages, 'page');

                if(loadedPages && loadedPages.length)
                {
                    var outMsgs = [];
                    if(loadedPages.length==2)
                    {
                        outMsgs = loadedPages[0].messages;
                    }

                    var lastPage = loadedPages[loadedPages.length-1];

                    for(var i=0; i<lastPage.messages.length; ++i)
                    {
                        if(currentMessage && lastPage.messages[i]._id == currentMessage._id)
                        {
                            break;
                        }
                        else
                        {
                            outMsgs.push(lastPage.messages[i]);
                        }
                    }

                    deferred.resolve(outMsgs);
                }
                else
                {
                    //return empty array
                    deferred.resolve([]);
                }
            })()
            .fail(function(error){
                deferred.reject(error);
            });

        return deferred.promise;
    }

}(exports));