var app = angular.module('commonDirectives', ["utils"]);
app.directive('notificationPopup', ["$rootScope", function($rootScope)
{
    return {
        scope: {
            notificationPopup: "=",
            autoClose: "="
        },
        templateUrl: "directives/notificationPopup.tpl.html",
        link: function (scope, element, attr)
        {
            element.find(".close").on("click", function(){
                scope.notificationPopup = null;
                element.fadeOut(400);
            });

            var timeoutHandler;

            scope.$watch("notificationPopup", function(popup){
                if(!popup) {
                    return;
                }

                element.fadeIn(400);

                if(scope.autoClose)
                {
                    if(timeoutHandler){
                        clearTimeout(timeoutHandler);
                    }

                    timeoutHandler = setTimeout(function(){
                        scope.notificationPopup = null;
                        element.fadeOut(400);
                    }, scope.autoClose * 1000);
                }
            });

        }
    };
}]);
