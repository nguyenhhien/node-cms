var loginApp = angular.module('loginApp', ["utils", "ui.router", "templates-app",
    "templates-common", "commonDirectives", 'facebook', 'googleplus', 'classy']);

var AUTH_EVENTS = {
    forbidden: 'auth:FORBIDDEN',
    loginSuccess: 'auth:LOGIN_SUCCESS',
    loginFailed: 'auth:LOGIN_FAILED',
    logout: 'auth:LOGOUT',
    redirectEnded: 'auth:REDIRECT_ENDED'
};

loginApp.constant('AUTH_EVENTS', AUTH_EVENTS);

loginApp.config(['FacebookProvider', '$stateProvider', '$urlRouterProvider', '$locationProvider', 'GooglePlusProvider',
    function (FacebookProvider, $stateProvider, $urlRouterProvider, $locationProvider, GooglePlusProvider) {
    $locationProvider.hashPrefix('!');

    //init appId
    FacebookProvider.init("627149314039365");
    GooglePlusProvider.init({
        clientId: '136519802127',
        scopes: [
            'https://www.googleapis.com/auth/plus.login',
            'https://www.googleapis.com/auth/plus.profile.emails.read'
        ]
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

loginApp.classy.controller({
    name: "LoginController",
    inject: ['$rootScope', '$scope', '$q', '$http', 'Facebook', 'GooglePlus'],
    init: function()
    {
        this.$.userInput = {};
    },
    login: function()
    {
        var that = this;

        that.$http.post("/api/users/signin", {email: this.$.userInput.email,
            password: CryptoJS.MD5(that.$.userInput.password).toString()})
            .then(function(response, status) {
                var data = response.data;

                if(data.error)
                {
                    that.$rootScope.notificationMessage = data;
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginFailed, data);
                }
                else
                {
                    that.$rootScope.user = data;
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
                }
            });
    },
    loginFacebook: function()
    {
        var that = this;

        if(!that.Facebook.isReady())
        {
            return console.error("facebook failed to initialize");
        }

        var accessToken;

        that.Facebook.login(function(){}, {scope: 'email'})
            .then(function(response){
                if(!response || !response.authResponse || !response.authResponse.accessToken || response.status != 'connected')
                {
                    return that.$q.reject({
                        error: "Facebook login failed"
                    });
                }

                accessToken = response.authResponse.accessToken;

                return that.$http.post("/api/users/facebookLogin", {fbId: response.authResponse.userID, accessToken: accessToken});
            })
            .then(function(response){
                var data = response.data;

                if(data.error)
                {
                    that.$rootScope.notificationMessage = data;
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginFailed, data);
                }
                else
                {
                    that.$rootScope.user = data;
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
                }
            },function (error) {
                that.$rootScope.notificationMessage = error;
            });
    },
    loginGoogle: function()
    {
        var that = this;
        var accessToken;

        that.GooglePlus.login()
            .then(function (authResult) {
                if(!authResult.access_token)
                {
                    return that.$q.reject({
                        error: "Google Login Failed"
                    });
                }

                accessToken = authResult.access_token;
                return that.GooglePlus.getUser();
            })
            .then(function(profile){
                var googleId = profile.id;
                return that.$http.post("/api/users/googleLogin", {googleId: googleId, accessToken: accessToken});
            })
            .then(function(response){
                var data = response.data;

                if(data.error)
                {
                    that.$rootScope.notificationMessage = data;
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginFailed, data);
                }
                else
                {
                    that.$rootScope.user = data;
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
                }
            },function (error) {
                that.$rootScope.notificationMessage = error;
            });
    }
});

loginApp.classy.controller({
    name: "RegisterController",
    inject: ['$rootScope', '$scope', '$q', '$location', '$window', '$http', 'Facebook', 'GooglePlus'],
    init: function()
    {
        this.$.userInput = {};
    },
    register: function()
    {
        var that = this;
        that.$http.post("/api/users/register",{
            name: that.$scope.userInput.name,
            email: that.$scope.userInput.email,
            password: CryptoJS.MD5(that.$scope.userInput.password).toString()
        })
            .then(function(response, status) {
                var data = response.data;

                if(data.error)
                {
                    that.$rootScope.notificationMessage = data;
                }
                else
                {
                    if(data.emailActivation)
                    {
                        that.$location.path("/activateAccount");
                    }
                    else
                    {
                        that.$window.location.href = "index.html";
                    }
                }
            });
    },
    registerWithFacebook: function()
    {
        var that = this;

        if(!that.Facebook.isReady())
        {
            return console.error("facebook failed to initialize");
        }

        var accessToken;

        that.Facebook.login(function(){}, {scope: 'email'})
            .then(function(response){
                if(!response || !response.authResponse || !response.authResponse.accessToken || response.status != 'connected')
                {
                    return that.$q.reject({
                        error: "Facebook login failed"
                    });
                }

                accessToken = response.authResponse.accessToken;

                return that.Facebook.api('/me', function(){});
            })
            .then(function(response){
                var email = response.email,
                    fbId = response.id,
                    name = response.name;

                return that.$http.post("/api/users/facebookRegister", {
                    name: name,
                    email: email,
                    fbId: fbId,
                    accessToken: accessToken
                });
            })
            .then(function(response){
                var data = response.data;

                if(data.error)
                {
                    that.$rootScope.notificationMessage = data;
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginFailed, data);
                }
                else
                {
                    that.$rootScope.user = data;
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
                }
            }, function(error){
                that.$rootScope.notificationMessage = error;
            });
    },
    registerWithGoogle: function()
    {
        var that = this;
        var accessToken;

        that.GooglePlus.login()
            .then(function (authResult) {
                if(!authResult.access_token)
                {
                    return that.$q.reject({
                        error: "Google Login Failed"
                    });
                }

                accessToken = authResult.access_token;

                return that.GooglePlus.getUser();
            })
            .then(function(profile){
                var email = profile.email,
                    googleId = profile.id,
                    name = profile.name;

                return that.$http.post("/api/users/googleRegister", {
                    name: name,
                    email: email,
                    googleId: googleId,
                    accessToken: accessToken
                });
            })
            .then(function(response){
                var data = response.data;

                if(data.error)
                {
                    that.$rootScope.notificationMessage = data;
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginFailed, data);
                }
                else
                {
                    that.$rootScope.user = data;
                    that.$rootScope.$broadcast(AUTH_EVENTS.loginSuccess, data);
                }
            }, function(error){
                that.$rootScope.notificationMessage = error;
            });
    }
});

loginApp.classy.controller({
    name: "ActivateAccountController",
    inject: ['$rootScope', '$scope', '$q', '$location', '$http'],
    init: function()
    {
        var that = this;
        this.activationKey = that.$.activationKey = that.$location.search().activationKey;

        if(!that.activationKey) {
            return;
        }

        that.$http.post("/api/users/activateAccount", {activationKey: that.activationKey})
            .then(function(response, status) {
                var data = response.data;

                if(data.error)
                {
                    that.$scope.activationSuccess = false;
                }
                else
                {
                    console.log("activate successful");
                    that.$scope.activationSuccess = true;
                }
            });
    }
});


loginApp.classy.controller({
    name: "ForgotPasswordController",
    inject: ['$rootScope', '$scope', '$q', '$location', '$http'],
    init: function()
    {
        var that = this;
        that.$.userInput = {};
        that.$.passwordResetEmailSent = false;
    },
    requestResetPassword: function()
    {
        var that = this;

        that.$http.post("/api/users/forgotPassword", {email: that.$.userInput.email})
            .then(function(response, status) {
                var data = response.data;

                if(data.error)
                {
                    $rootScope.notificationMessage = data;
                }
                else
                {
                    console.log("email sent successful");
                    that.$.passwordResetEmailSent = true;
                }
            });
    }
});


loginApp.classy.controller({
    name: "ResetPasswordController",
    inject: ['$rootScope', '$scope', '$q', '$location', '$http'],
    init: function()
    {
        var that = this;
        that.$.userInput = {};
        that.passwordResetKey = that.$.passwordResetKey = that.$location.search().passwordResetKey;
        that.$.updatedPassword = false;
    },
    updatePassword: function()
    {
        var that = this;

        that.$http.post("/api/users/resetPassword", {
            passwordResetKey: that.passwordResetKey,
            password: CryptoJS.MD5(that.$.userInput.password).toString()
        })
            .then(function(response, status) {
                var data = response.data;

                that.$.updatedPassword = true;
                that.$.updateStatus = data;
            });
    }
});






