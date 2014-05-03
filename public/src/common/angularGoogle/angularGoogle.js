(function(window, angular, undefined){
    'use strict';

    // Module global settings.
    var settings = {};

    // Module global flags.
    var flags = {
        sdk: false,
        ready: false
    };

    // Module global loadDeferred
    var loadDeferred;

    angular.module('google', [])
        .value('settings', settings)
        .value('flags', flags)
        .provider('Google', [function(){
            settings.appId = null;

            this.setAppId = function(appId) {
                settings.appId = appId;
            };

            this.getAppId = function() {
                return settings.appId;
            };

            settings.loadSDK = true;

            this.setLoadSDK = function(a) {
                settings.loadSDK = !!a;
            };

            this.getLoadSDK = function() {
                return settings.loadSDK;
            };

            this.init = function(initSettings) {
                // If string is passed, set it as appId
                if (angular.isString(initSettings)) {
                    settings.appId = initSettings || settings.appId;
                }

                // If object is passed, merge it with app settings
                if (angular.isObject(initSettings)) {
                    angular.extend(settings, initSettings);
                }
            };

            this.$get = [
                '$q',
                '$rootScope',
                '$timeout',
                '$window',
                function($q, $rootScope, $timeout, $window) {
                    function NgGoogle()
                    {
                        this.appId = settings.appId;
                    }

                    angular.forEach([
                        'signIn',
                        'signOut'
                    ], function(name){
                        NgGoogle.prototype[name] = function() {

                            var d = $q.defer(),
                                args = Array.prototype.slice.call(arguments), // Converts arguments passed into an array
                                userFn,
                                userFnIndex;

                            // Get user function and it's index in the arguments array, to replace it with custom function, allowing the usage of promises
                            angular.forEach(args, function(arg, index) {
                                if (angular.isFunction(arg)) {
                                    userFn = arg;
                                    userFnIndex = index;
                                }
                            });

                            // Replace user function intended to be passed to the Facebook API with a custom one
                            // for being able to use promises.
                            if (angular.isFunction(userFn) && angular.isNumber(userFnIndex)) {
                                args.splice(userFnIndex, 1, function(response) {
                                    $timeout(function() {
                                        if (angular.isUndefined(response.error)) {
                                            d.resolve(response);
                                        } else {
                                            d.reject(response);
                                        }

                                        if (angular.isFunction(userFn)) {
                                            userFn(response);
                                        }
                                    });
                                });
                            }

                            $timeout(function() {
                                // Call when loadDeferred be resolved, meaning Service is ready to be used.
                                loadDeferred.promise.then(function() {
                                    $window.gapi.auth[name].apply(gapi.auth, args);
                                }, function() {
                                    throw 'Google API could not be initialized properly';
                                });
                            });

                            return d.promise;
                        };
                    });
                }];

        }])
        .run([
            '$rootScope',
            '$q',
            '$window',
            '$timeout',
            function($rootScope, $q, $window, $timeout) {
                loadDeferred = $q.defer();

                var loadSDK = settings.loadSDK;
                delete(settings['loadSDK']);
                if(loadSDK)
                {
                    (function injectScript() {
                        (function() {
                            var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
                            po.src = 'https://apis.google.com/js/client:plusone.js';
                            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);

                            //finish loading
                            po.onload = function() {
                                flags.sdk = true; // Set sdk global flag
                                loadDeferred.resolve(); //finish loading
                            };

                        })();
                    })();
                }
            }]);
})(window, angular);