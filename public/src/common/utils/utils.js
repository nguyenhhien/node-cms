(function()
{
    var utils = angular.module('utils', []);

    utils.factory('$safeApply', function safeApplyFactory($rootScope, $exceptionHandler) {
        return function safeApply(scope, expr) {
            scope = scope || $rootScope;
            if (['$apply', '$digest'].indexOf(scope.$root.$$phase) !== -1) {
                try {
                    return scope.$eval(expr);
                } catch (e) {
                    $exceptionHandler(e);
                }
            } else {
                return scope.$apply(expr);
            }
        };
    });

    //this is used to parse the profile
    utils.value('urlBase64Decode', function (str) {
        var output = str.replace('-', '+').replace('_', '/');
        switch (output.length % 4) {
            case 0: { break; }
            case 2: { output += '=='; break; }
            case 3: { output += '='; break; }
            default: {
                throw 'Illegal base64url string!';
            }
        }
        return window.atob(output);
    });

})();