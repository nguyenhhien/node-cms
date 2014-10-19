var app = angular.module( 'common.chatWidget', []);

app.filter("filterFirstName", function(){
    return function(input){
        var tokens = input.split(/[ @]+/);
        return tokens[0];
    };
});

app.filter("filterTimeAgo", function(){
    return function(timestamp) {
        var fromNow = moment(timestamp).fromNow();
        return fromNow;
    };
});

app.directive('chatTextarea', ["$rootScope", function($rootScope){
    return {
        scope: {
            submitMessage: "&",
            chatSession: "=",
            idx: "="
        },
        link: function (scope, element, attr)
        {
            element.keydown(function (e) {
                var keypressed = e.keyCode || e.which;

                if (keypressed == 13) {
                    scope.submitMessage({
                        message: element.val(),
                        chatSession: scope.chatSession,
                        idx: scope.idx
                    });

                    //empty textbox
                    element.val("");
                    e.preventDefault();
                }
            });
        }
    };
}]);

//a chat conversation widget; specific chat session
app.directive('chatConversation', ["$rootScope", function($rootScope){
    return {
        scope: {
            superSocket: "=",
            chatSession: "=",
            idx: "="
        },
        templateUrl: "chatWidget/chatSession.tpl.html",
        link: function (scope, element, attr)
        {
            scope.me = $rootScope.user;

            scope.submitMessage = function(chatSession, message, idx)
            {
                scope.superSocket.post('/api/chat/sendChatMessage', {message: message, conversationId: chatSession._id, idx:idx}, function(err, data) {
                    if(err)
                    {
                        console.log("init chat session error", err.stack || err);
                    }
                    else
                    {
                        console.log("init chat session successfully", data);
                    }
                });
            };

            scope.getFirstUserNotMe = function(users)
            {
                var temp = _.filter(users, function(elem){
                    return elem.id != $rootScope.user.id;
                });

                if(!temp.length){
                    return {};
                }
                else
                {
                    return temp[0];
                }
            };


            function scrollToBottom()
            {
                setTimeout(function(){
                    //scroll the textbox to the bottom
                    var elem = element.find("#chat-window-inner-content-"+ scope.idx);

                    elem.scrollTop(elem[0].scrollHeight + 40);
                }, 500);
            }

            //when receive a new message
            scope.superSocket.on("chat:newChatMessage", function(data){
                if(data.message)
                {
                    console.log("Receive new message", data);
                }

                if(scope.chatSession._id != data.conversationId)
                {
                    return;
                }

                safeApply(scope, function(){
                    scope.chatSession.chatBlocks = scope.chatSession.chatBlocks || [];

                    if(scope.chatSession.chatBlocks.length)
                    {
                        var lastMsgBlock = scope.chatSession.chatBlocks[scope.chatSession.chatBlocks.length-1];

                        //if same user --> put to last msg block
                        if(lastMsgBlock.user.id == data.from.id)
                        {
                            lastMsgBlock.messages = lastMsgBlock.messages || [];
                            lastMsgBlock.messages.push(_.omit(data, 'from'));
                        }
                        else
                        {
                            //create new block
                            scope.chatSession.chatBlocks.push({
                                user: data.from,
                                messages: [
                                    _.omit(data, 'from')
                                ]
                            });
                        }
                    }
                    else
                    {
                        //also create new block
                        scope.chatSession.chatBlocks.push({
                            user: data.from,
                            messages: [
                                _.omit(data, 'from')
                            ]
                        });
                    }
                });

                scrollToBottom();
            });

            //scroll to bottom once init new chat session
            scope.$watch('chatSession', function(elem){
                if(!!elem)
                {
                    scrollToBottom();
                }
            });
        }
    };
}]);

//small widget contain list of online user
app.directive('chatWidget', ["$rootScope", "$resource", function($rootScope, $resource)
{
    return {
        scope: {
            superSocket: "=",
            user: "="
        },
        templateUrl: "chatWidget/chatWidget.tpl.html",
        controller: ['$scope', '$element', function(scope, element)
        {
            scope.offset = 0;
            scope.loadingMoreUser = false;
            scope.users = [];

            scope.chatSessions = [];

            //initialize chat with that user
            scope.openChat = function(user)
            {
                var chatSession = {
                    users: [user],
                    messages: [
                        {
                            user: scope.user,
                            content: "hello"
                        }
                    ],
                    show: true
                };

                safeApply(scope, function(){
                    //TODO: create new chat session
                    scope.superSocket.post('/api/chat/initChatSession', {userIds: [scope.me.id+"", chatSession.users[0].id]}, function(err, data) {
                        if(err)
                        {
                            console.log("init chat session error", err.stack || err);
                        }
                        else
                        {
                            console.log("init chat session successfully", data);
                        }
                    });
                });
            };

            //establish new chat session successfully
            scope.superSocket.on("chat:newChatSession", function(data){
                if(data.chatSession)
                {
                    var newChatSession = data.chatSession;
                    var foundIdx = _.findIndex(scope.chatSessions, function(elem){
                        return elem._id = newChatSession._id;
                    });

                    if(foundIdx != -1)
                    {
                        safeApply(scope, function(){
                            scope.chatSessions[foundIdx].hideWindow = false;
                        });

                        return;
                    }

                    //now need to join conversation explicitly
                    scope.superSocket.post('/api/chat/joinConversation', {conversationId: data.chatSession._id}, function(err, res) {
                        if(err)
                        {
                            console.log("init chat session error", err.stack || err);
                        }
                        else
                        {
                            console.log("new chat session was established", res.oldMessages);

                            var userMap = {};
                            _.forEach(res.users, function(user){
                                userMap[user.id] = user;
                            });

                            //init the chat session
                            newChatSession.chatBlocks = newChatSession.chatBlocks || [];

                            _.forEach(res.oldMessages, function(data){
                                var from = userMap[data.userId];
                                data.timestamp = data.postedDate;
                                data.message = data.content;

                                if(newChatSession.chatBlocks.length)
                                {
                                    var lastMsgBlock = newChatSession.chatBlocks[newChatSession.chatBlocks.length-1];

                                    //if same user --> put to last msg block
                                    if(lastMsgBlock.user.id == from.id)
                                    {
                                        lastMsgBlock.messages = lastMsgBlock.messages || [];
                                        lastMsgBlock.messages.push(data);
                                    }
                                    else
                                    {
                                        //create new block
                                        newChatSession.chatBlocks.push({
                                            user: from,
                                            messages: [
                                               data
                                            ]
                                        });
                                    }
                                }
                                else
                                {
                                    //also create new block
                                    newChatSession.chatBlocks.push({
                                        user: from,
                                        messages: [
                                            data
                                        ]
                                    });
                                }
                            });

                            console.log("chat block is", newChatSession.chatBlocks);

                            safeApply(scope, function(){
                                scope.chatSessions.push(newChatSession);
                            });
                        }
                    });
                }
            });

            //add user to online list
            function pushUser(user)
            {
                var foundIdx = _.findIndex(scope.users, function(elem){return elem.id == user.id;});
                if(foundIdx >= 0 || (scope.user && scope.user.id == user.id))
                {
                    return;
                }
                scope.users.push(user);
            }

            //remove user from online list
            function popUser(user)
            {
                scope.users = _.filter(scope.users, function(elem){return elem.id != user.id;});
            }

            //get all online users
            function loadOnlineUsers()
            {
                scope.loadingMoreUser = true;

                scope.superSocket.post('/api/chat/getOnlineUser', {offset: scope.offset, limit: 20}, function(err, data) {
                    if (data && data.rows && data.rows.length) {
                        scope.offset += 20;

                        //push into current list
                        safeApply(scope, function(){
                            _.forEach(data.rows, function(user){
                                pushUser(user);
                            });
                        });
                    }

                    scope.loadingMoreUser = false;
                });
            }

            //load online user list
            if(scope.superSocket && scope.superSocket._isConnected())
            {
                loadOnlineUsers();
            }
            else if(scope.superSocket)
            {
                scope.superSocket.on("event:connect", function(data){
                    scope.me = data;
                    loadOnlineUsers();
                });
            }

            //push or remove user from the chat list
            scope.superSocket.on("user.changeStatus", function(err, user){
                if(err)
                {
                    return console.log("[socket.io] error when getting user online", err);
                }

                if(user.status == 'online')
                {
                    safeApply(scope, function(){
                        pushUser(user);
                    });
                }
                else if(user.status == 'offline')
                {
                    safeApply(scope, function(){
                        popUser(user);
                    });
                }
            });
        }],
        link: function (scope, element, attr)
        {
            element.find(".chat-window.main-window")
                .resizable({
                    handles: 'n'
                })
                .bind("resize", function(event, ui){
                    $(this).css("top", "auto");
                });
        }
    };
}]);


