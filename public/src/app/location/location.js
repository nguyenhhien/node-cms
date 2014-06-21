var app = angular.module( 'mainApp.location', [
        'ui.router',
        'utils',
        'localytics.directives',
        'ui.bootstrap',
        'mgcrea.ngStrap',
        'common.commentThread',
        'templates-common',
        'common.treeView',
        'ngResource'
    ])
    .config(function config( $stateProvider ) {
        $stateProvider
            .state('locations', {
                url: '/locations',
                templateUrl: 'location/location.tpl.html',
                controller: 'LocationController',
                resolve: {}
            });
    });


app.controller("LocationController", function($rootScope, $scope, $http, User, utils, $resource){
    this.$inject = ['$rootScope', '$scope', '$http', 'User', 'utils', '$resource'];

});
