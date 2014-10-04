var app = angular.module('common.fancyBox', [
]);

app.directive('beaverFancyBox', ['$compile', function($compile) {
    return {
        restrict: 'A',
        scope: {
            type: "=",
            description: "=",
            fancyMethods: "="
        },
        replace: false,
        link: function($scope, element, attrs) {
            $scope.internalFancyMethods = $scope.fancyMethods || {};

            $scope.internalFancyMethods.open = function() {
                var el = angular.element(element.html()),
                compiled = $compile(el);
                $.fancybox.open(el);
                compiled($scope);
            };
        }
    };
}]);