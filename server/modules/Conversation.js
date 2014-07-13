'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');
    var mongoose            = require('../database/mongoose.js');

    //create new conversation and add existing user into list
    module.createNewConversation = function(users)
    {
        users.forEach(function(user){
            user.joinedDate = new Date();
        })

        return mongoose.models.Conversation
            .createQ({
                numPages: 1,
                users: users
            });
    }

    //add new user into conversation
    module.addUserIntoConversation = function(conversationId, user)
    {
        return mongoose.models.Conversation
            .find()
            .where('_id', conversationId)
            .where('users.id').in([user.id])
            .lean()
            .execQ()
            .then(function(conversation){
                if(!conversation.length)
                {
                    //push user into existing array
                    mongoose.models.Conversation
                        .update({
                            _id: conversationId
                        },
                        {
                            $push:
                            {
                                users: user
                            }
                        })
                        .execQ();
                }
                else
                {
                    //do nothing
                    return Q();
                }
            })
    }

    //remove user from conversation
    module.removeUserFromConversation = function(conversationId, userId)
    {
        return mongoose.models.Conversation
            .update({
                _id: conversationId
            },
            {
                $pull:
                {
                    users: {
                        id: userId
                    }
                }
            })
            .execQ();
    }

    //delete a certain message inside the array
    module.deleteMessage = function(conversationId, page, userId, messageId)
    {
        return mongoose.models.ConversationPage
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
        return mongoose.models.Conversation
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
                    mongoose.models.ConversationPage.findOneAndUpdate({
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
                if(conversationPage.count >= 100)
                {
                    return mongoose.models.Conversation
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
}(exports));