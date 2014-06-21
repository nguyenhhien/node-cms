var app = angular.module( 'common.dropdownTreeView', [
    'utils',
    'localytics.directives',
    'ui.bootstrap',
    'mgcrea.ngStrap',
    'ngResource',
    'utils',
    'common.treeView'
]);


app.directive('dropdownTreeView', ["$rootScope", "$resource", "utils", function($rootScope, $resource, utils)
{
    return {
        scope: {
            objectName: "@",
            visibleLevel: "@",
            initNodeId: "@", //allow setting nodeId from outside to initialize, for example
            selectedTreeNode: "="
        },
        templateUrl: "dropdownTreeView/dropdownTreeView.tpl.html",
        link: function (scope, element, attr)
        {
            var visibleLevel = scope.visibleLevel || 3;

            scope.dropdownVisible = false;

            element.find(".chosen-container").css({
                width: element.width()
            });

            scope.toggleDropdown = function()
            {
                scope.dropdownVisible = !scope.dropdownVisible;

                if(scope.dropdownVisible)
                {
                    element.find(".chosen-container").css({
                        width: element.width()
                    });

                    //autofocus
                    element.find(".chosen-search input").focus();
                }
            };

            scope.$watch('selectedTreeNode', function(selected, oldSelected){
                if(selected && !!selected.manualUserSelect)
                {
                    scope.toggleDropdown();
                }
            });
        }
    };

}]);