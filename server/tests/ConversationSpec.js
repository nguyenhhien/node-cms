var Q                   = require("q");
var _                   = require('lodash-node');
var winston             = require('winston');
var async               = require('async');

var dbmock              = require('../mocks/databasemocks');
var mongoose            = require('../database/mongoose.js');
var sequelize           = require("../database/sequelize.js");
var redis               = require("../database/redis.js");
var mongo               = require("../database/mongo.js");
var modules             = require("../modules/index.js");

describe('chat conversation module specs', function(){
    beforeEach(function(done){
        dbmock.initMongoose()
            .then(function(){
                done();
            })
            .fail(function(){
                done(false);
            })
    });

    afterEach(function(done){
        mongoose.connection.db.dropDatabase(function(err, data){
            dbmock.closeMongoose()
                .then(function(){
                    done();
                })
                .fail(function(err){
                    winston.error(err);
                    done();
                });
        })
    });

    var users = [
        {
            id: 17,
            avatar: "https://avatar17.com"
        },
        {
            id: 18,
            avatar: "https://avatar18.com"
        }
    ];

    it('add new/remove user conversation', function(done){
        var newConversation = {};

        modules.Conversation.createNewConversation([users[0]])
            .then(function(conversation){
                newConversation = conversation;

                //add new user into conversation
                return modules.Conversation.addUserIntoConversation(conversation._id, users[1]);
            })
            .then(function(){
                //check if there are two users in the conversation
                return mongoose.models.Conversation
                    .findById(newConversation._id)
                    .lean()
                    .execQ()
                    .then(function(conversation){
                        expect(conversation.users.length).toEqual(2);
                        expect([17, 18].indexOf(parseInt(conversation.users[0].id))).not.toEqual(-1);
                        expect([17, 18].indexOf(parseInt(conversation.users[1].id))).not.toEqual(-1);
                    })
            })
            .then(function(){
                return modules.Conversation.removeUserFromConversation(newConversation._id, users[0].id);
            })
            .then(function(){
                return mongoose.models.Conversation
                    .findById(newConversation._id)
                    .lean()
                    .execQ()
                    .then(function(conversation){
                        expect(conversation.users.length).toEqual(1);
                        expect(parseInt(conversation.users[0].id)).toEqual(users[1].id);
                        done();
                    })
            })
            .fail(function(err){
                console.log("ERROR LOG", err);
                expect(err).toBe(null);
                done();
            })
    });

    it('add/remove user message', function(done){
        var newConversation = {};
        var conversationPage;

        modules.Conversation.createNewConversation(users)
            .then(function(conversation){
                newConversation = conversation;
                return modules.Conversation.addMessage(newConversation._id, users[0].id, "message 1");
            })
            .then(function(conversation){
                return mongoose.models.ConversationPage
                    .find()
                    .lean()
                    .execQ()
                    .then(function(allConversationPage){
                        expect(allConversationPage.length).toEqual(1);
                        expect(allConversationPage[0].messages[0].content).toEqual("message 1");
                        conversationPage = allConversationPage[0];
                        expect(conversationPage.page).toEqual(1);
                        done();
                    })
            })
            .then(function(){
                return modules.Conversation.deleteMessage(conversationPage.conversationId, conversationPage.page, users[0].id, conversationPage.messages[0]._id);
            })
            .then(function(){
                //check if message is soft-deleted
                return mongoose.models.ConversationPage
                    .findOne()
                    .where('_id', conversationPage._id)
                    .where('page', conversationPage.page)
                    .lean()
                    .execQ();
            })
            .then(function(curPage){
                expect(curPage.messages[0].isDeleted).toEqual(1);
                done();
            })
            .fail(function(err){
                console.log("ERROR LOG", err);
                expect(err).toBe(null);
                done();
            })
    });

    it('should create new conversation page', function(done){
        var newConversation = {};
        var conversationPage;
        var pageSize = 100;
        modules.Conversation.createNewConversation(users)
            .then(function(conversation){
                newConversation = conversation;

                var finalPromise = Q();

                for(var i=0; i<=pageSize; ++i)
                {
                    (function(i){
                        finalPromise = finalPromise.then(function(){
                            return modules.Conversation.addMessage(newConversation._id, users[i%2].id, "message " +i);
                        })
                    }(i));
                }

                return finalPromise;
            })
            .then(function(){
                //there is exactly two conversation pages
                return mongoose.models.ConversationPage
                    .countQ()
                    .then(function(count){
                        expect(count).toBe(2);
                    })
            })
            .then(function(){
                return mongoose.models.ConversationPage
                    .findOne()
                    .where('conversationId', newConversation._id)
                    .where('page', 2)
                    .lean()
                    .execQ();
            })
            .then(function(conversationPage){
                //check if there is two conversation pages is created
                expect(conversationPage.messages.length).toBe(1);
                expect(conversationPage.count).toBe(1);
                done();
            })
            .fail(function(err){
                console.log("ERROR LOG", err);
                expect(err).toBe(null);
                done();
            });
    });
})
