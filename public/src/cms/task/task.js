var app = angular.module( 'mainApp.task', [])
    .config(['$stateProvider', function config( $stateProvider ) {
        $stateProvider
            .state('tasks', {
                url: '/tasks',
                templateUrl: 'task/task.tpl.html',
                controller: 'TaskController',
                resolve: {}
            });
    }]);


app.controller("TaskController", ['$rootScope', '$scope', '$http', '$resource', 'Restangular', function($rootScope, $scope, $http, $resource, Restangular){
    var task = {
        name: "CASSANDRA-5780",
        description: "nodetool status and ring report incorrect/stale information after decommission",
        assignee: {
            avatar: "http://cms.beaver.com:9000/content/avatar/5da3b7021472d52a9d48a44fd1337445256ce304.jpg"
        }
    };

    $scope.projects = [
        {
            name: "Leave Application",
            nTasks: 5,
            todo: [_.cloneDeep(task),_.cloneDeep(task),_.cloneDeep(task),_.cloneDeep(task)],
            inprogress: [_.cloneDeep(task)],
            complete: [_.cloneDeep(task)]
        },
        {
            name: "Development",
            nTasks: 5,
            todo: [_.cloneDeep(task),_.cloneDeep(task),_.cloneDeep(task),_.cloneDeep(task)],
            inprogress: [_.cloneDeep(task)],
            complete: [_.cloneDeep(task)]
        }
    ];
}]);
