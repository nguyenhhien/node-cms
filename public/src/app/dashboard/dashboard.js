var app = angular.module( 'mainApp.dashboard', [
        'appModels',
        'ui.router',
        'classy',
        'ActiveResource',
        'utils',
        'localytics.directives',
        'ui.bootstrap',
        'mgcrea.ngStrap',
        'templates-common',
        'common.commentThread',
        'common.treeView'
    ])
    .config(function config( $stateProvider ) {
        $stateProvider
            .state('dashboard', {
                url: '/',
                templateUrl: 'dashboard/dashboard.tpl.html',
                controller: 'DashboardController',
                resolve: {}
            });
    });

app.controller("DashboardController", function($rootScope, $scope, $http, User, utils, $resource){
    this.$inject = ['$rootScope', '$scope', '$http', 'User', 'utils', '$resource'];

    var socket = io.connect(location.protocol + "//" + location.host, {
        'connect timeout': 500,
        'reconnect': true,
        'reconnection delay': 500,
        'reopen delay': 500,
        'max reconnection attempts': 10
    });

    socket.on('event:connect', function(data){
        console.log('connect successfully', data);

        socket.emit('modules.chats.list', function(err, chats) {

        });
    });

    socket.on('event:chats.userStopTyping', function(uid) {

    });

    socket.on('event:chats.userStartTyping', function(uid) {

    });

    socket.on('event:chats.receive', function(data) {

    });

});
