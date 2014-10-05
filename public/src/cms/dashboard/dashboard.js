var app = angular.module( 'mainApp.dashboard', [])
    .config(function config( $stateProvider ) {
        $stateProvider
            .state('dashboard', {
                url: '/',
                templateUrl: 'dashboard/dashboard.tpl.html',
                controller: 'DashboardController',
                resolve: {}
            });
    });

app.controller("DashboardController", ['$rootScope', '$scope', '$http', 'utils', '$resource', '$modal',
    function($rootScope, $scope, $http, utils, $resource, $modal){
    $scope.openModal = function()
    {
        showInfo($modal, "Some Error happen");
    };
}]);
