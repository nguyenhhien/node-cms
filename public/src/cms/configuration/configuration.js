var app = angular.module( 'mainApp.configuration', [
        'templates-cms_common'
    ])
    .config(function config( $stateProvider ) {
        $stateProvider
            .state('configuration', {
                url: '/configuration',
                templateUrl: 'configuration/configuration.tpl.html',
                controller: 'ConfigurationController',
                resolve: {}
            });
    });

app.controller("ConfigurationController", ['$rootScope', '$scope', '$http', '$resource', '$modal', function($rootScope, $scope, $http, $resource, $modal){

}]);
