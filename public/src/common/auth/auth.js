(function(){
    var auth = angular.module('auth', ['utils', 'ngCookies']);

    var AUTH_EVENTS = {
        forbidden: 'auth:FORBIDDEN',
        loginSuccess: 'auth:LOGIN_SUCCESS',
        loginFailed: 'auth:LOGIN_FAILED',
        logout: 'auth:LOGOUT',
        redirectEnded: 'auth:REDIRECT_ENDED'
    };

    auth.constant('AUTH_EVENTS', AUTH_EVENTS);

    //authentication based on cookies
    function AuthCookies($http, $cookieStore, $rootScope, $safeApply, $q)
    {
        this.$http = $http;
        this.$cookieStore = $cookieStore;
        this.$rootScope = $rootScope;
        this.$safeApply = $safeApply;
        this.$q = $q;
    }

    AuthCookies.prototype = {};

    AuthCookies.prototype.signin = function (options) {
        if(!options.email || !options.password){
            return {
                error: "Missing Params"
            };
        }

        var deferred = this.$q.defer();
        var that = this;

        that.$http.post("/api/users/signin",
            {
                email: options.email,
                password: options.password
            })
            .success(function(data, status) {
                if(data.error)
                {
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginFailed, data);
                }
                else
                {
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
                }

                return deferred.resolve(data);
            });

        return deferred.promise;
    };

    AuthCookies.prototype.register = function (options) {
        if(!options.email || !options.password || !options.fullname)
        {
            return {
                error: "Missing Params"
            };
        }

        var deferred = this.$q.defer();
        var that = this;

        that.$http.post("/api/users/register",
            {
                name: options.name,
                email: options.email,
                password: options.password
            })
            .success(function(data, status) {
                return deferred.resolve(data);
            });

        return deferred.promise;
    };

    AuthCookies.prototype.forgotPassword = function (options) {
        if(!options.email){
            return {
                error: "Missing Params"
            };
        }

        var deferred = this.$q.defer();
        var that = this;

        that.$http.post("/api/users/forgotPassword", {
            name: options.name,
            email: options.email,
            password: options.password
        })
        .success(function(data, status) {
           return deferred.resolve(data);
        });

        return deferred.promise;
    };

    AuthCookies.prototype.activateAccount = function (options) {
        if(!options.activationKey){
            return {
                error: "Missing Params"
            };
        }

        var deferred = this.$q.defer();
        var that = this;

        that.$http.post("/api/users/activateAccount", {
            activationKey: options.activationKey
        })
            .success(function(data, status) {
                return deferred.resolve(data);
            });

        return deferred.promise;
    };

    auth.provider('authCookies', [
        '$provide',
        function ($provide) {
            var authWrapper;
            this.init = function (options) {
                //TODO: put initialization code here
            };
            this.$get = [
                '$http',
                '$cookieStore',
                '$rootScope',
                '$safeApply',
                '$q',
                '$injector',
                function ($http, $cookieStore, $rootScope, $safeApply, $q, $injector) {
                    var authWrapper = new AuthCookies($http, $cookieStore, $rootScope, $safeApply, $q);
                    return authWrapper;
                }
            ];
        }
    ]);

})();