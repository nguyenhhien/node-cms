require("../../constant.js");

var Q                   = require("q");
var _                   = require('lodash-node');
var winston             = require('winston');
var async               = require('async');

var beaver              = require('../../../Beaver.js');

describe('chat conversation module specs', function(){
    beforeEach(function(done){
        beaver.mock(function(error, data){
            if(error)
            {
                console.log(error.stack || error);
                done(false);
            }
            else
            {
                done();
            }
        });
    });

    afterEach(function(done){
        beaver.mongoose.client.db.dropDatabase(function(err, data){
            beaver.mongoose.close()
                .then(function(){
                    beaver.redis.close();
                    beaver.sequelize.close();
                    beaver.mongo.close();
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

        Q.async(
            function*(){
                newConversation = yield beaver.modules.Conversation.createNewConversation([users[0]])
                yield beaver.modules.Conversation.addUserIntoConversation(newConversation._id, users[1]);

                var conversation = yield beaver.models.mongoose.Conversation
                    .findById(newConversation._id)
                    .lean()
                    .execQ();

                expect(conversation.users.length).toEqual(2);
                expect([17, 18].indexOf(parseInt(conversation.users[0].id))).not.toEqual(-1);
                expect([17, 18].indexOf(parseInt(conversation.users[1].id))).not.toEqual(-1);

                yield beaver.modules.Conversation.removeUserFromConversation(newConversation._id, users[0].id);

                var conversation = yield beaver.models.mongoose.Conversation
                    .findById(newConversation._id)
                    .lean()
                    .execQ();

                expect(conversation.users.length).toEqual(1);
                expect(parseInt(conversation.users[0].id)).toEqual(users[1].id);
                done();
            })()
            .fail(function(err){
                console.log("ERROR LOG", err);
                expect(err).toBe(null);
                done();
            });
    });

    it('add/remove user message', function(done){
        var newConversation = {};
        var conversationPage;

        Q.async(
            function*(){
                newConversation = yield beaver.modules.Conversation.createNewConversation(users)
                yield beaver.modules.Conversation.addMessage(newConversation._id, users[0].id, "message 1");

                var allConversationPage = yield beaver.models.mongoose.ConversationPage
                    .find()
                    .lean()
                    .execQ();

                expect(allConversationPage.length).toEqual(1);
                expect(allConversationPage[0].messages[0].content).toEqual("message 1");
                conversationPage = allConversationPage[0];
                expect(conversationPage.page).toEqual(1);

                yield beaver.modules.Conversation.deleteMessage(conversationPage.conversationId, conversationPage.page, users[0].id, conversationPage.messages[0]._id);

                var curPage = yield beaver.models.mongoose.ConversationPage
                    .findOne()
                    .where('_id', conversationPage._id)
                    .where('page', conversationPage.page)
                    .lean()
                    .execQ();

                expect(curPage.messages[0].isDeleted).toEqual(1);
                done();
            })()
            .fail(function(err){
                console.log("ERROR LOG", err);
                expect(err).toBe(null);
                done();
            });
    });

    it('should create new conversation page', function(done){
        var newConversation = {};
        var conversationPage;
        var pageSize = beaver.config.global.chatPageSize || 100;

        Q.async(
            function*(){
                var newConversation = yield beaver.modules.Conversation.createNewConversation(users);

                var finalPromise = Q();

                for(var i=0; i<=pageSize+9; ++i)
                {
                    (function(i){
                        finalPromise = finalPromise.then(function(){
                            return beaver.modules.Conversation.addMessage(newConversation._id, users[i%2].id, "message " +i);
                        })
                    }(i));
                }

                yield finalPromise;

                var count = yield beaver.models.mongoose.ConversationPage
                    .countQ();

                expect(count).toBe(2);

                var conversationPage = yield beaver.models.mongoose.ConversationPage
                    .findOne()
                    .where('conversationId', newConversation._id)
                    .where('page', 2)
                    .lean()
                    .execQ();

                expect(conversationPage.messages.length).toBe(10);
                expect(conversationPage.count).toBe(10);

                //last message is
                var lastMessage = conversationPage.messages[9];

                var previousMsgs = yield beaver.modules.Conversation.loadPreviousMessages(newConversation._id);

                expect(previousMsgs.length).toBe(110);

                done();
            })()
            .fail(function(err){
                console.log("ERROR LOG", err);
                expect(err).toBe(null);
                done();
            });
    });

})

