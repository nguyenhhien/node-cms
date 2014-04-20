var loginApp = angular.module('loginApp', ["utils", "auth", "ui.router", "templates-app"]);
loginApp.config(function ($stateProvider, $urlRouterProvider) {
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
        });

    $urlRouterProvider.otherwise("/login");
});

loginApp.run(["$rootScope", "$state", "AUTH_EVENTS", function ($rootScope, $state, AUTH_EVENTS){
}]);

loginApp.controller('LoginController', ['$rootScope', 'authCookies', '$q', function($rootScope, authCookies, $q){
   $q.when(authCookies.signin({
            email: 'test@gmail.com',
            password: '111111'
        })).then(
           function(data){
               console.log(data);
           },
           function(err){
               console.log("err", err);
           }
        );

}]);

loginApp.controller('RegisterController', ['$rootScope', function($rootScope){

}]);

loginApp.controller('ForgotPasswordController', ['$rootScope', function($rootScope){

}]);




