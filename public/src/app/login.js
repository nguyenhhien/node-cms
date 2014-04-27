var loginApp = angular.module('loginApp', ["utils", "auth", "ui.router", "templates-app",
    "templates-common", "commonDirectives", 'facebook']);

var AUTH_EVENTS = {
    forbidden: 'auth:FORBIDDEN',
    loginSuccess: 'auth:LOGIN_SUCCESS',
    loginFailed: 'auth:LOGIN_FAILED',
    logout: 'auth:LOGOUT',
    redirectEnded: 'auth:REDIRECT_ENDED'
};

loginApp.constant('AUTH_EVENTS', AUTH_EVENTS);

loginApp.config(['FacebookProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', function (FacebookProvider, $stateProvider, $urlRouterProvider, $locationProvider) {
    $locationProvider.hashPrefix('!');

    //init appId
    FacebookProvider.init("627149314039365");

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

loginApp.run(["$rootScope", "$state", "AUTH_EVENTS", "$q", "$window", function ($rootScope, $state, AUTH_EVENTS, $q, $window){
    $rootScope.$on(AUTH_EVENTS.loginSuccess, function () {
        $window.location.href = "index.html";
    });
}]);

loginApp.controller('LoginController', ['$rootScope', '$scope', 'authCookies', '$q', '$http', 'Facebook', function($rootScope, $scope, authCookies, $q, $http, Facebook){
    $scope.userInput = {};
    $scope.login = function()
    {
        $http.post("/api/users/signin", {
                email: $scope.userInput.email,
                password: CryptoJS.MD5($scope.userInput.password).toString()
            })
            .success(function(data, status) {
                if(data.error)
                {
                    $rootScope.notificationMessage = data;
                    $rootScope.$broadcast(AUTH_EVENTS.loginFailed, data);
                }
                else
                {   $rootScope.user = data;
                    $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
                }
            });
    };

    $scope.loginFacebook = function()
    {
        if(!Facebook.isReady())
        {
            return console.error("facebook failed to initialize");
        }

        Facebook.login(function(response) {
            Facebook.api('/me', function(response) {
                console.log("my data", response);
            });
        }, {scope: 'email,user_likes'});
    };
}]);

loginApp.controller('RegisterController',
    ['$rootScope', '$scope', 'authCookies', '$q', '$location', '$window', '$http', 'Facebook', function($rootScope, $scope, authCookies, $q, $location, $window, $http, Facebook){
    $scope.userInput = {};
    $scope.register = function()
    {
        $http.post("/api/users/register",{
                name: $scope.userInput.name,
                email: $scope.userInput.email,
                password: CryptoJS.MD5($scope.userInput.password).toString()
            })
            .success(function(data, status) {
                if(data.error)
                {
                    $rootScope.notificationMessage = data;
                }
                else
                {
                    if(data.emailActivation)
                    {
                        $location.path("/activateAccount");
                    }
                    else
                    {
                        $window.location.href = "index.html";
                    }
                }
            });
    };

    $scope.registerWithFacebook = function()
    {
        if(!Facebook.isReady())
        {
            return console.error("facebook failed to initialize");
        }

        Facebook.login(function(response) {
            if(!response || !response.authResponse || !response.authResponse.accessToken || response.status != 'connected')
            {
                $rootScope.notificationMessage = {
                    error: "Facebook login failed"
                };

                return;
            }

            var accessToken = response.authResponse.accessToken;

            Facebook.api('/me', function(response) {
                var email = response.email,
                    fbId = response.id,
                    name = response.name;

                //register with facebook
                $http.post("/api/users/facebookRegister", {
                    name: name,
                    email: email,
                    fbId: fbId,
                    accessToken: accessToken
                })
                    .success(function(data){
                        if(data.error)
                        {
                            $rootScope.notificationMessage = data;
                            $rootScope.$broadcast(AUTH_EVENTS.loginFailed, data);
                        }
                        else
                        {   $rootScope.user = data;
                            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
                        }
                    });
            });
        }, {scope: 'email'});
    };
}]);

//activate the account
loginApp.controller('ActivateAccountController', ['$rootScope', '$scope', 'authCookies', '$q', '$location', '$http', function($rootScope, $scope, authCookies, $q, $location, $http){
    var activationKey = $location.search().activationKey;
    $scope.activationKey = activationKey;

    //page to show user to check account; so return immediately
    if(!activationKey) {
        return;
    }

    $http.post("/api/users/activateAccount", {activationKey: activationKey})
        .success(function(data, status) {
            if(data.error)
            {
                $scope.activationSuccess = false;
            }
            else
            {
                console.log("activate successful");
                $scope.activationSuccess = true;
            }
        });
}]);

//ask server to send the reset password email
loginApp.controller('ForgotPasswordController', ['$rootScope', '$scope', 'authCookies', '$q', '$location', '$http', function($rootScope, $scope, authCookies, $q, $location, $http){
    $scope.userInput = {};
    $scope.passwordResetEmailSent = false;

    $scope.requestResetPassword = function()
    {
        $http.post("/api/users/forgotPassword", {
            email: $scope.userInput.email
        })
            .success(function(data, status) {
                if(data.error)
                {
                    $rootScope.notificationMessage = data;
                }
                else
                {
                    console.log("email sent successful");
                    $scope.passwordResetEmailSent = true;
                }
            });
    };
}]);

//Update the password
loginApp.controller('ResetPasswordController', ['$rootScope', '$scope', 'authCookies', '$q', '$location', '$http', function($rootScope, $scope, authCookies, $q, $location, $http){
    $scope.userInput = {};
    var passwordResetKey = $location.search().passwordResetKey;
    $scope.passwordResetKey = passwordResetKey;
    $scope.updatedPassword = false;

    $scope.updatePassword = function()
    {
        $http.post("/api/users/resetPassword", {
            passwordResetKey: passwordResetKey,
            password: CryptoJS.MD5($scope.userInput.password).toString()
        })
            .success(function(data, status) {
                $scope.updatedPassword = true;
                $scope.updateStatus = data;
            });
    };
}]);




