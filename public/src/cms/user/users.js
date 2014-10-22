var app = angular.module( 'mainApp.user', [])
    .config(['$stateProvider', function config( $stateProvider ) {
        $stateProvider
            .state('users', {
                url: '/users',
                templateUrl: 'user/search.tpl.html',
                controller: 'UserSearchController',
                resolve: {}
            })
            .state('users.details', {
                url: '/users/:id',
                templateUrl: 'user/edit.tpl.html',
                controller: 'UserEditController',
                resolve: {}
            });
    }]);

app.controller("UserSearchController", ['$rootScope', '$scope', '$http', '$resource', 'Restangular', function($rootScope, $scope, $http, $resource, Restangular){
    $scope.itemsPerPage = 10;
    $scope.currentPage = 1;

    $scope.getUsers = function(offset, limit)
    {
        Restangular.all('user').getList({offset: offset, limit: limit})
            .then(function(users){
                $scope.users = users;
                $scope.totalItems = users.count;

            }, function(error){
                showError(error.stack || error);
            });
    };

    $scope.$watch('currentPage', function(currentPage)
    {
        if(currentPage)
        {
            //load current page
            $scope.getUsers((currentPage-1)* $scope.itemsPerPage, $scope.itemsPerPage);
        }
    });
}]);
