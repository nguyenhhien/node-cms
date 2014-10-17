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

        Q.async(
            function*(){
                //get all users in the chat session
                var users = yield Q.denodeify(beaver.redis.getObjectsFields)(userIds.map(function(uid){
                    return "user:" + uid;
                }), ['id', 'name', 'email', 'avatar', 'status', 'lastonline']);

                //create new chat session between those users
                var newConversation = yield beaver.modules.Conversation.createNewConversation(users);

                //broadcast conversation event for the other users involved
                if(req.io && req.socket)
                {
                    var clients = req.io.sockets.sockets;

                    //search for those user sockets
                    clients.forEach(function(client) {
                        if(client.uid && userIds.indexOf(client.uid) === -1) {
                            client.emit("chat:newChatSession", {
                                users: users,
                                chatSession: newConversation
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

                var key = "chatSession:" + conversationId;
                var userIds = yield Q.denodeify(beaver.redis.getObject)(key);

                if(1 || !userIds)
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

                    userIds = (conversation[0].users || []).map(function(elem){
                        return elem.id;
                    });

                    yield Q.denodeify(beaver.redis.setObject)(key, userIds);
                    yield Q.denodeify(beaver.redis.expire)(key, 60*5);
                }

                //search for those user sockets
                clients.forEach(function(client) {
                    if(client.uid && userIds.indexOf(client.uid) === -1) {
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