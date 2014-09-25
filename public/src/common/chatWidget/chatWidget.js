var app = angular.module( 'common.chatWidget', [
    'utils',
    'localytics.directives',
    'ui.bootstrap',
    'mgcrea.ngStrap',
    'ngResource',
    'utils'
]);

app.directive('chatTextarea', ["$rootScope", "utils", function($rootScope, utils){
    return {
        scope: {
            submitMessage: "&",
            chatSession: "="
        },
        link: function (scope, element, attr)
        {
            element.keydown(function (e) {
                var keypressed = e.keyCode || e.which;

                if (keypressed == 13) {
                    scope.submitMessage({
                        message: element.val(),
                        chatSession: scope.chatSession
                    });

                    //empty textbox
                    element.val("");
                    e.preventDefault();
                }
            });
        }
    };
}]);

app.directive('chatWidget', ["$rootScope", "$resource", "utils", function($rootScope, $resource, utils)
{
    return {
        scope: {
            socketServer: "=",
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

                //TODO: change to a more suitable logic
                var foundIdx = _.findIndex(scope.chatSessions, function(session){
                    var differences = _.difference(
                        _.map(chatSession.users, function(user){return user.id;}),
                        _.map(session.users, function(user){return user.id;})
                    );

                    if(differences.length > 0) {
                        return true;
                    }

                    return false;
                });

                if(foundIdx == -1)
                {
                    utils.$safeApply(scope, function(){
                        scope.chatSessions.push(chatSession);
                    });
                }
            };

            scope.submitMessage = function(chatSession, message)
            {
                var newMsg = {
                    user: scope.user,
                    content: message
                };

                utils.$safeApply(scope, function(){
                    chatSession.messages.push(newMsg);
                    element.animate({scrollTop: element.prop("scrollHeight")}, 500);
                });
            };

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

            function loadOnlineUsers()
            {
                scope.loadingMoreUser = true;

                scope.socketServer.emit('user.loadMore', {set: "users:online", offset: scope.offset, limit: 20}, function(err, data) {
                    if (data && data.results && data.results.length) {
                        scope.offset += 20;

                        //push into current list
                        utils.$safeApply(scope, function(){
                            _.forEach(data.results, function(user){
                                pushUser(user);
                            });
                        });
                    }

                    scope.loadingMoreUser = false;
                });
            }

            //load online user list
            if(scope.socketServer && scope.socketServer.connected)
            {
                loadOnlineUsers();
            }
            else
            {
                scope.socketServer.on("event:connect", function(data){
                    loadOnlineUsers();
                });
            }

            //push or remove user from the chat list
            scope.socketServer.on("user.isOnline", function(err, user){
                if(err)
                {
                    return console.log("[socket.io] error when getting user online", err);
                }

                if(user.status == 'online')
                {
                    utils.$safeApply(scope, function(){
                        pushUser(user);
                    });
                }
                else if(user.status == 'offline')
                {
                    utils.$safeApply(scope, function(){
                        popUser(user);
                    });
                }
            });
        }],
        link: function (scope, element, attr)
        {

        }
    };
}]);


