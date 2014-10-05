var app = angular.module( 'mainApp.dashboard', [
        'ui.router',
        'classy',
        'utils',
        'localytics.directives',
        'ui.bootstrap',
        'templates-cms_common',
        'common.commentThread',
        'common.treeView',
        'common.chatWidget',
        'common.fancyBox'
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

app.controller("DashboardController", ['$rootScope', '$scope', '$http', 'utils', '$resource', '$modal',
    function($rootScope, $scope, $http, utils, $resource, $modal){
    $scope.openModal = function()
    {
        showInfo($modal, "Some Error happen");
    };
}]);
