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
        'common.treeView',
        'common.chatWidget'
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


});
