(function()
{
    var utils = angular.module('utils', []);

    utils.factory('utils', function(){
        this.$inject = ["$rootScope", "$exceptionHandler"];

        var utils = {};
        utils.$safeApply = function(scope, expr)
        {
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

        utils.urlBase64Decode = function(str)
        {
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
        };

        utils.generateRandomString = function(length)
        {
            var setC = 'abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                setP = '$#@*&!()';

            var outS = "";

            for (var i = 0; i < length-2; ++i) {
                var n = setC.length;
                outS += setC.charAt(Math.floor(Math.random() * n));
            }

            for(var j= 0; j<2; ++j)
            {
                var m=setP.length;
                outS += setP.charAt(Math.floor(Math.random() * m));
            }

            return _.shuffle(outS.split("")).join("");
        };

        return utils;
    });
})();