var app = angular.module( 'common.task', []);

app.directive('taskBlock', ["$rootScope", "$resource", function($rootScope, $resource)
{
    return {
        scope: {
            task: "="
        },
        templateUrl: "tasks/taskBlock.tpl.html",
        link: function (scope, element, attr)
        {

        }
    };
}]);