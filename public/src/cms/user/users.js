var app = angular.module( 'mainApp.user', [])
    .config(function config( $stateProvider ) {
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
    });

app.controller("UserSearchController", ['$rootScope', '$scope', '$http', '$resource', function($rootScope, $scope, $http, $resource){
    $scope.itemsPerPage = 10;
    $scope.currentPage = 1;

    var UserResource = $resource('/api/user/:id', {id: '@_id'}, {
        query:{
            isArray: true, method: 'GET',
            transformResponse: function (data, headers) {
                if(JSON.parse(data) && JSON.parse(data).rows)
                {
                    $scope.totalItems = JSON.parse(data).count;
                    return JSON.parse(data).rows;
                }
                else
                {
                    return data;
                }
            }
        }
    });

    $scope.getUsers = function(offset, limit)
    {
        UserResource.query({
            limit: limit, offset: offset
        }).$promise.then(function(response){
            $scope.users = response;
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
