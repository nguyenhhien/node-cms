'use strict';

(function(module) {
    var Q                   = require("q");
    var async               = require("async");
    var beaver              = require("../../Beaver.js");
    var _                   = require("lodash-node");

    //get list of user who is online
    module.getOnlineUser = function(req, res)
    {
        if(_.isUndefined(req.param("offset")) || _.isUndefined(req.param("limit"))) {
            return res.error('[socket: invalid-data]');
        }

        var start = req.param("offset"),
            end = start + ((req.param("limit") - 1) || 19);

        var key = "users:online";

        Q.async(
            function*(){
                var uids = yield Q.denodeify(beaver.redis.getSortedSetRevRange)(key, start, end);

                var userData = yield Q.denodeify(beaver.redis.getObjectsFields)(uids.map(function(uid){
                    return "user:" + uid;
                }), ['id', 'name', 'email', 'avatar', 'status', 'lastonline']);

                var nUsers = yield Q.denodeify(beaver.redis.sortedSetCard)(key);

                //only get online user
                userData = userData.filter(function(item) {
                    return item.status !== 'offline';
                });

                res.success({
                    count: nUsers,
                    rows: userData
                });
            })()
            .fail(function(error){
                res.error(error.stack || error);
            });
    }

    //init chat session
    module.initChatSession = function(req, res){
        var userIds = req.param("userIds");

        if(!userIds || !userIds.length)
        {
            return res.error('[socket] empty user list');
        }

        userIds = _.chain(userIds)
            .map(function(elem){
                return _.parseInt(elem);
            })
            .filter(function(elem){
                return !_.isNaN(elem);
            })
            .value();

        if(userIds.indexOf(req.session.user.id) == -1)
        {
            return res.error('[socket] logged in user in session does not belong to requested userIds params');
        }

        Q.async(
            function*(){
                //get all users in the chat session
                var users = yield Q.denodeify(beaver.redis.getObjectsFields)(userIds.map(function(uid){
                    return "user:" + uid;
                }), ['id', 'name', 'email', 'avatar', 'status', 'lastonline']);

                var conversation = yield beaver.modules.Conversation.findExistingConversation(users);

                if(!conversation.length)
                {
                    //create new chat session between those users
                    conversation = yield beaver.modules.Conversation.createNewConversation(users);
                }
                else
                {
                    //get the first matched
                    conversation = conversation[0];

                    //TODO: also return list of message in history
                    var oldMessage = yield beaver.modules.Conversation.loadPreviousMessages(conversation._id);
                }

                //broadcast conversation event for the other users involved
                if(req.io && req.socket)
                {
                    var clients = req.io.sockets.sockets;

                    //search for those user sockets
                    clients.forEach(function(client) {
                        if(client.uid && userIds.indexOf(client.uid) !== -1) {
                            client.emit("chat:newChatSession", {
                                users: users,
                                chatSession: conversation
                            });
                        }
                    });

                    //just return success
                    res.success({});
                }
            })()
            .fail(function(error){
                res.error(error.stack || error);
            });
    }

    //broadcast chat message to others
    module.sendChatMessage = function(req, res)
    {
        var message = req.param("message");
        var conversationId = req.param("conversationId");

        Q.async(
            function*(){
                //get list of users in the conversation
                var clients = req.io.sockets.sockets;

                //TODO: might want better way to get list of all users involved in a certain chat session
                var key = "chatSession:" + conversationId;
                var userIds = yield Q.denodeify(beaver.redis.getObjectField)(key, "userIds");

                if(!userIds)
                {
                    //load from database and save to redis first
                    var conversation = yield beaver.models.mongoose.Conversation
                        .find()
                        .where('_id', conversationId)
                        .lean()
                        .execQ();

                    if(!conversation || !conversation.length)
                    {
                        return res.success({});
                    }

                    //convert 25,26 -> [25, 26]
                    userIds = _.chain(conversation[0].users || [])
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

                    yield Q.denodeify(beaver.redis.setObjectField)(key, "userIds", userIds);
                    yield Q.denodeify(beaver.redis.expire)(key, 60*5);
                }
                else
                {
                    //convert 25,26 -> [25, 26]
                    if(_.isString(userIds)){
                        userIds = _.chain(_.uniq(userIds.split(',')))
                            .map(function(elem){
                                return _.parseInt(elem);
                            })
                            .filter(function(elem){
                                return (!_.isNaN(elem));
                            })
                            .value();
                    };
                }

                //add the existing message into database
                yield beaver.modules.Conversation.addMessage(conversationId, req.session.user.id, message);

                //search for those user sockets
                clients.forEach(function(client) {
                    if(client.uid && userIds.indexOf(client.uid) !== -1) {
                        client.emit("chat:newChatMessage", {
                            timestamp: new Date(),
                            from: req.session.user,
                            conversationId: conversationId,
                            message: message
                        });
                    }
                });

                //just return success
                res.success({});
            })()
            .fail(function(error){
                res.error(error.stack || error);
            });
    }
}(exports));