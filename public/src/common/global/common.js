function safeApply (scope, expr)
{
    scope = scope || $rootScope;
    if (['$apply', '$digest'].indexOf(scope.$root.$$phase) !== -1) {
        try {
            return scope.$eval(expr);
        } catch (e) {
            console.error("Exception when executing safeApply", e.stack || e);
        }
    } else {
        return scope.$apply(expr);
    }
}

function showError($modal, errorMessage, options)
{
    $modal.open({
        templateUrl : "modal/infoModal.tpl.html",
        controller : ['$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.type = 'error';
            $scope.title ='ERROR';
            $scope.description = errorMessage;

            $scope.closeModal = function()
            {
                $modalInstance.dismiss('cancel');
            };
        }]
    });
}

//show info message
function showInfo($modal, infoMsg, options)
{
    $modal.open({
        templateUrl : "modal/infoModal.tpl.html",
        controller : ['$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.type = 'info';
            $scope.title ='INFO';
            $scope.description = infoMsg;

            $scope.closeModal = function()
            {
                $modalInstance.dismiss('cancel');
            };
        }]
    });
}

//show success msg
function showSuccess(msg)
{
    $.growl.notice({title: 'Success', message: msg });
}


var app = angular.module('common', []);

app.directive('headerHint', ["$rootScope", "$resource", "utils", function($rootScope, $resource, utils)
{
    return {
        scope: {
            description: "@",
            marginTop: "@"
        },
        templateUrl: "global/headerHint.tpl.html",
        link: function (scope, element, attr)
        {
            console.log(scope.description, scope.marginTop);

        }
    };
}]);

app.directive('headerBreadCrump', ["$rootScope", "$resource", "utils", function($rootScope, $resource, utils)
{
    return {
        scope: {
            title: "@",
            subTitle: "@",
            iconClass: "@"
        },
        templateUrl: "global/headerBreadCrump.tpl.html",
        link: function (scope, element, attr)
        {
        }
    };
}]);


