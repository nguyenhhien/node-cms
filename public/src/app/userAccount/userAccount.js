var app = angular.module( 'mainApp.userAccount', ['ui.router','facebook', 'googleplus', 'classy'])
.config(function config( $stateProvider ) {
    $stateProvider
        .state('userAccount', {
            url: '/userAccount',
            templateUrl: 'userAccount/userAccount.tpl.html',
            controller: 'UserAccountController',
            resolve: {}
        });
});

app.classy.controller({
    name: "UserAccountController",
    inject: ['$rootScope', '$scope'],
    init: function()
    {

    }
});

