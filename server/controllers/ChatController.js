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

        userIds = beaver.utils.parseId(userIds);

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
                }

                //broadcast conversation event for the other users involved
                if(req.io && req.socket)
                {
                    //get socket id of connected user
                    var socketIds = yield beaver.modules.Socket.getUsersSocketIds(userIds);

                    socketIds.forEach(function(socketId){
                        req.io.sockets.in(socketId).emit("chat:newChatSession", {
                            users: users,
                            chatSession: conversation
                        });
                    });

                    //just return success
                    res.success({});
                }
            })()
            .fail(function(error){
                res.error(error.stack || error);
            });
    }

    //after broadcast init chat session --> client need to join conversation explicitly
    //it is because in multiple process; we cannot retrieve list of socket but can only broadcast event through them
    module.joinConversation = function(req, res)
    {
        var conversationId = req.param("conversationId");

        if(!conversationId)
        {
            return res.error("missing required parameter conversationId");
        }

        Q.async(
            function*(){
                //get user id in this conversation
                var userInfo = yield beaver.modules.Socket.getUserInConversation(conversationId);
                var userIds = userInfo.userIds;

                //if requested user in the list; allow them to join
                if(_.indexOf(userIds, req.session.user.id) != -1)
                {
                    req.socket.join(conversationId);
                }

                //TODO: return old message; it should only be used for user who joined conversation in the past not new user
                var oldMessages = yield beaver.modules.Conversation.loadPreviousMessages(conversationId);

                res.success({
                    users: userInfo.users,
                    oldMessages: oldMessages
                });
            })()
            .fail(function(error){
                res.error(error.stack || error);
            });

    }

    //leave certain conversation -- TODO: put the leave user to a field in Conversation table/document to keep track
    module.leaveConversation = function(req, res)
    {
        var conversationId = req.param("conversationId");

        if(!conversationId)
        {
            return res.error("missing required parameter conversationId");
        }

        Q.async(
            function*(){
                yield beaver.modules.Conversation.removeUserFromConversation(conversationId, req.session.user.id);
                req.socket.leave(conversationId);
                res.success({});
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
                //add the existing message into database
                yield beaver.modules.Conversation.addMessage(conversationId, req.session.user.id, message);

                req.io.sockets.in(conversationId).emit("chat:newChatMessage", {
                    timestamp: new Date(),
                    from: req.session.user,
                    conversationId: conversationId,
                    message: message
                });

                //just return success
                res.success({});
            })()
            .fail(function(error){
                res.error(error.stack || error);
            });
    }
}(exports));