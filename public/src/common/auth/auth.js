(function(){
    //status: server code: 404 or something
    function LoginError(status, details) {
        var obj;

        if (typeof details == 'string') {
            try {
                obj = JSON.parse(details);
            } catch (er) {
                obj = {message: details};
            }
        } else {
            obj = details || { description: 'server error' };
        }

        if (obj && !obj.code) {
            obj.code = obj.error;
        }

        var err = Error.call(this, obj.description || obj.message || obj.error);

        err.status = status;
        err.name = obj.code;
        err.code = obj.code;
        err.details = obj;

        if (status === 0) {
            err.code = "Unknown";
            err.message = "Unknown error.";
        }

        return err;
    }

    if (Object && Object.create) {
        LoginError.prototype = Object.create(Error.prototype, {
            constructor: { value: LoginError }
        });
    }

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
        var deferred = this.$q.defer();
        var that = this;

        if(!options.email || !options.password){
           return false;
        }

        that.$http.post("/api/usernamepassword/login", {
            email: options.email,
            password: options.password
        })
        .success(function(data, status) {
            that.$rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
            return deferred.resolve();
        })
        .error(function(data, status) {
            var error = new LoginError(status, data);
            that.$rootScope.$broadcast(AUTH_EVENTS.loginFailed, error);
            return deferred.reject(error);
        });

        return deferred.promise;
    };

    AuthCookies.prototype.register = function (options) {
        var deferred = this.$q.defer();
        var that = this;

        //if(!options.email || !options.password || !options.fullname) return deferred.reject();

        that.$http.post("/api/usernamepassword/register", {
            fullname: options.fullname,
            email: options.email,
            password: options.password
        })
        .success(function(data, status) {
            deferred.resolve(data);
        })
        .error(function(data, status) {
            var error = new LoginError(status, data);
            deferred.reject(data);
        });

        return deferred.promise;
    };

    AuthCookies.prototype.forgotPassword = function (options) {
        var deferred = this.$q.defer();
        var that = this;

        //if(!options.email) return deferred.reject();

        that.$http.post("/api/forgotPassword", {
            fullname: options.fullname,
            email: options.email,
            password: options.password
        })
        .success(function(data, status) {
            deferred.resolve(data);
        })
        .error(function(data, status) {
            var error = new LoginError(status, data);
            deferred.reject(data);
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