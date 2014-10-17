var loginApp = angular.module('loginApp', [
        "utils",
        "ui.router",
        'ui.bootstrap',
        "templates-login_main",
        "templates-login_common",
        "commonDirectives",
        'facebook',
        'googleplus',
        'classy'
    ]);

var AUTH_EVENTS = {
    forbidden: 'auth:FORBIDDEN',
    loginSuccess: 'auth:LOGIN_SUCCESS',
    loginFailed: 'auth:LOGIN_FAILED',
    logout: 'auth:LOGOUT',
    redirectEnded: 'auth:REDIRECT_ENDED'
};

loginApp.constant('AUTH_EVENTS', AUTH_EVENTS);

var Configuration;

loginApp.config(['FacebookProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', 'GooglePlusProvider',
    function (FacebookProvider, $stateProvider, $urlRouterProvider, $locationProvider, GooglePlusProvider) {
    $locationProvider.hashPrefix('!');

    $.post('/api/configuration/find')
        .done(function(res){
            Configuration = res;
            try
            {
                if(Configuration)
                {
                    FacebookProvider.init(Configuration.oath.Facebook.clientId);
                    GooglePlusProvider.init({
                        clientId: Configuration.oath.Google.clientId,
                        scopes: [
                            'https://www.googleapis.com/auth/plus.login',
                            'https://www.googleapis.com/auth/plus.profile.emails.read'
                        ]
                    });
                }
            }
            catch(e)
            {
                console.log("Error", e.stack || e);
            }
        })
        .fail(function(error){
            if(error) {
                showError(error.stack || error);
            }
        });

    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'login/login.tpl.html',
            controller: 'LoginController',
            resolve: {}
        })
        .state('register', {
            url: '/register',
            templateUrl: 'register/register.tpl.html',
            controller: 'RegisterController',
            resolve: {}
        })
        .state("forgotPassword", {
            url: "/forgotPassword",
            templateUrl: "forgotPassword/forgotPassword.tpl.html",
            controller: 'ForgotPasswordController',
            resolve: {}
        })
        .state("activateAccount", {
            url: "/activateAccount",
            templateUrl: "activateAccount/activateAccount.tpl.html",
            controller: 'ActivateAccountController',
            resolve: {}
        })
        .state("resetPassword", {
            url: "/resetPassword",
            templateUrl: "resetPassword/resetPassword.tpl.html",
            controller: 'ResetPasswordController',
            resolve: {}
        });

    $urlRouterProvider.otherwise("/login");
}]);

loginApp.run(["$rootScope", "$state", "AUTH_EVENTS", "$q", "$window",
    function ($rootScope, $state, AUTH_EVENTS, $q, $window){
    $rootScope.$on(AUTH_EVENTS.loginSuccess, function () {
        $window.location.href = "index.html";
    });
}]);

loginApp.controller("LoginController", ['$rootScope', '$scope', '$q', '$http', 'Facebook', 'GooglePlus', '$modal', function($rootScope, $scope, $q, $http, Facebook, GooglePlus, $modal){
    $scope.userInput = {};

    $scope.login = function()
    {
        $http.post("/api/user/signin", {
            email: $scope.userInput.email,
            password: CryptoJS.MD5($scope.userInput.password).toString()})
            .success(function(response) {
                var data = response;

                $rootScope.user = data;
                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
            })
            .error(function(error){
                showError($modal, error.stack || error.error || error);
            });
    };

    $scope.loginFacebook = function()
    {
        var that = this;

        if(!Facebook.isReady())
        {
            return console.error("facebook failed to initialize");
        }

        var accessToken;

        Facebook.login(function(){}, {scope: 'email'})
            .then(function(response){
                if(!response || !response.authResponse || !response.authResponse.accessToken || response.status != 'connected')
                {
                    return $q.reject({
                        error: "Facebook login failed"
                    });
                }

                accessToken = response.authResponse.accessToken;

                return $http.post("/api/user/facebookLogin", {fbId: response.authResponse.userID, accessToken: accessToken});
            })
            .then(function(response){
                var data = response;

                $rootScope.user = data;
                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
            },function (error) {
                showError($modal, error.stack || error.error || error);
            });
    };

    $scope.loginGoogle = function(){
        var that = this;
        var accessToken;

        GooglePlus.login()
            .then(function (authResult) {
                if(!authResult.access_token)
                {
                    return $q.reject({
                        error: "Google Login Failed"
                    });
                }

                accessToken = authResult.access_token;
                return GooglePlus.getUser();
            })
            .then(function(profile){
                var googleId = profile.id;
                return $http.post("/api/user/googleLogin", {googleId: googleId, accessToken: accessToken});
            })
            .then(function(response){
                var data = response;

                $rootScope.user = data;
                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);

            },function (error) {
                showError($modal, error.stack || error.error || error);
            });
    };
}]);


loginApp.controller("RegisterController", ['$rootScope', '$scope', '$q', '$http', 'Facebook', 'GooglePlus', '$location', '$modal', '$window', function($rootScope, $scope, $q, $http, Facebook, GooglePlus, $location, $modal, $window){
    $scope.userInput = {};

    $scope.register = function()
    {
        var that = this;
        $http.post("/api/user/register",{
            name: $scope.userInput.name,
            email: $scope.userInput.email,
            password: CryptoJS.MD5($scope.userInput.password).toString()
        })
            .success(function(response, status) {
                var data = response;

                if(data.emailActivation)
                {
                    $location.path("/activateAccount");
                }
                else
                {
                    $window.location.href = "index.html";
                }
            })
            .error(function(error){
                showError($modal, error.stack || error.error || error);
            });
    };

    $scope.registerWithFacebook = function()
    {
        var that = this;

        if(!Facebook.isReady())
        {
            return console.error("facebook failed to initialize");
        }

        var accessToken;

        Facebook.login(function(){}, {scope: 'email'})
            .then(function(response){
                if(!response || !response.authResponse || !response.authResponse.accessToken || response.status != 'connected')
                {
                    return $q.reject({
                        error: "Facebook login failed"
                    });
                }

                accessToken = response.authResponse.accessToken;

                return Facebook.api('/me', function(){});
            })
            .then(function(response){
                var email = response.email,
                    fbId = response.id,
                    name = response.name;

                return $http.post("/api/user/facebookRegister", {
                    name: name,
                    email: email,
                    fbId: fbId,
                    accessToken: accessToken
                });
            })
            .then(function(response){
                var data = response;

                $rootScope.user = data;
                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
            }, function(error){
                showError($modal, error.stack || error.error || error);
            });
    };

    $scope.registerWithGoogle = function(){
        var that = this;
        var accessToken;

        GooglePlus.login()
            .then(function (authResult) {
                if(!authResult.access_token)
                {
                    return $q.reject({
                        error: "Google Login Failed"
                    });
                }

                accessToken = authResult.access_token;

                return GooglePlus.getUser();
            })
            .then(function(profile){
                var email = profile.email,
                    googleId = profile.id,
                    name = profile.name;

                return $http.post("/api/user/googleRegister", {
                    name: name,
                    email: email,
                    googleId: googleId,
                    accessToken: accessToken
                });
            })
            .then(function(response){
                var data = response;

                $rootScope.user = data;
                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
            }, function(error){
                showError($modal, error.stack || error.error || error);
            });
    };
}]);

loginApp.controller("ActivateAccountController", ['$rootScope', '$scope', '$q', '$http', 'Facebook', 'GooglePlus', '$location', '$modal', function($rootScope, $scope, $q, $http, Facebook, GooglePlus, $location, $modal){
    var activationKey = $scope.activationKey = $location.search().activationKey;

    if(!activationKey) {
        return;
    }

    $http.post("/api/user/activateAccount", {activationKey: activationKey})
        .success(function(response, status) {
            console.log("activate successful");
            $scope.activationSuccess = true;
        })
        .error(function(error){
            if(error && error.error)
            {
                $scope.activationSuccess = false;
            }
            else
            {
                showError($modal, error.stack || error.error || error);
            }
        });
}]);

loginApp.controller("ForgotPasswordController", ['$rootScope', '$scope', '$q', '$http', 'Facebook', 'GooglePlus', '$location', '$modal', function($rootScope, $scope, $q, $http, Facebook, GooglePlus, $location, $modal){
    var that = this;
    $scope.userInput = {};
    $scope.passwordResetEmailSent = false;

    $scope.requestResetPassword = function()
    {
        var that = this;

        $http.post("/api/user/forgotPassword", {email: $scope.userInput.email})
            .success(function(response, status) {
                console.log("email sent successful");
                $scope.passwordResetEmailSent = true;
            })
            .error(function(error){
                if(error && error.error)
                {
                    $scope.activationSuccess = false;
                }
                else
                {
                    showError($modal, error.stack || error.error || error);
                }
            });
    };
}]);

loginApp.controller("ResetPasswordController", ['$rootScope', '$scope', '$q', '$http', 'Facebook', 'GooglePlus', '$location', '$modal', function($rootScope, $scope, $q, $http, Facebook, GooglePlus, $location, $modal){
    var that = this;
    $scope.userInput = {};
    var passwordResetKey = $scope.passwordResetKey = $location.search().passwordResetKey;
    $scope.updatedPassword = false;

    $scope.updatePassword = function()
    {
        var that = this;

        $http.post("/api/user/resetPassword", {
            passwordResetKey: passwordResetKey,
            password: CryptoJS.MD5($scope.userInput.password).toString()
        })
            .success(function(response, status) {
                var data = response;

                $scope.updatedPassword = true;
                $scope.updateStatus = data;
            })
            .error(function(error){
                showError($modal, error.stack || error.error || error);
            });
    };
}]);








