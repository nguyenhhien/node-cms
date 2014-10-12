var app = angular.module( 'mainApp.location', [
        'ui.router',
        'localytics.directives',
        'ui.bootstrap',
        'common.commentThread',
        'templates-cms_common',
        'common.treeView',
        'common.dropdownTreeView',
        'ngResource'
    ])
    .config(['$stateProvider', function config( $stateProvider ) {
        $stateProvider
            .state('locations', {
                url: '/locations',
                templateUrl: 'location/location.tpl.html',
                controller: 'LocationController',
                resolve: {}
            });
    }]);


app.controller("LocationController", function($rootScope, $scope, $http, $resource){
    this.$inject = ['$rootScope', '$scope', '$http', '$resource'];
    $scope.selectedLocation = {};
    $scope.selectedLocation.parentId = 15;
});
