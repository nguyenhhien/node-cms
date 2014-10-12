var app = angular.module( 'mainApp.configuration', [])
    .config(['$stateProvider', '$urlRouterProvider', function config( $stateProvider, $urlRouterProvider) {
        $urlRouterProvider
            .when('/configuration', ['$state', function ($state) {
                $state.go('configuration.overview');
            }]);

        $stateProvider
            .state('configuration', {
                url: '/configuration',
                templateUrl: 'configuration/configuration.tpl.html',
                controller: 'ConfigurationController',
                resolve: {}
            })
            .state('configuration.overview', {
                url: '/overview',
                templateUrl: 'configuration/configurationOverview.tpl.html',
                controller: 'ConfigurationOverviewController',
                resolve: {}
            })
            .state('configuration.application', {
                url: '/application',
                templateUrl: 'configuration/configurationApplication.tpl.html',
                controller: 'ConfigurationApplicationController',
                resolve: {}
            });
    }]);

app.controller("ConfigurationController", ['$rootScope', '$scope', '$http', '$resource', '$modal', function($rootScope, $scope, $http, $resource, $modal){
    function loadConfiguration()
    {
        $http.get("/api/configuration/find")
            .success(function(res){
                $scope.configuration = res;
            })
            .error(function(error){
                showError(error.stack || error);
            });
    }

    //update configuration
    $scope.updateConfiguration = function()
    {
        $http.post("/api/configuration/update", $scope.configuration)
            .success(function(res){
                showSuccess("configuration has been updated successfully");
            })
            .error(function(error){
                showError(error.stack || error);
            });
    };

    $scope.userAgent = navigator.userAgent;

    loadConfiguration();
}]);

app.controller("ConfigurationOverviewController", ['$rootScope', '$scope', '$http', '$resource', '$modal', function($rootScope, $scope, $http, $resource, $modal){

}]);

app.controller("ConfigurationApplicationController", ['$rootScope', '$scope', '$http', '$resource', '$modal', function($rootScope, $scope, $http, $resource, $modal){

}]);