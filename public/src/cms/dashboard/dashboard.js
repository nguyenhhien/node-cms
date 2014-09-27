var app = angular.module( 'mainApp.dashboard', [
        'ui.router',
        'classy',
        'utils',
        'localytics.directives',
        'ui.bootstrap',
        'mgcrea.ngStrap',
        'templates-cms_common',
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

app.controller("DashboardController", function($rootScope, $scope, $http, utils, $resource){
    this.$inject = ['$rootScope', '$scope', '$http', 'utils', '$resource'];


});
