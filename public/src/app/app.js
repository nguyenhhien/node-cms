//manual bootstrap application after get all information needed
var User;

//temporarily put here because right now both login, main page share same js files
if(location.href.indexOf("index.html") != -1)
{
    $.ajax({
        url: '/api/users/userInfo',
        method: "POST",
        dataType: "json"
    })
        .done(function (user)
        {
            if(user.error)
            {
                window.location = "/login.html";
                return console.log("ERROR: ", user.error);
            }

//            console.log("USER: ", user);
            User = user;
            $("body").show();
            angular.bootstrap(document, ["mainApp"]);
        });

}

angular.module( 'mainApp', [
    'templates-app',
    'templates-common',
    'ui.router',
    'mainApp.userAccount',
    'mainApp.user',
    'commonDirectives'
])

.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function myAppConfig ( $stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise( '/' );
    $locationProvider.hashPrefix('!');
}])

.run(['$http', '$rootScope', function run ($http, $rootScope) {
    $rootScope.user = User;

    //share object for .dot rule angularjs
    $rootScope.globalObj = {};
}])

.controller( 'mainCtrl', ['$scope', '$location', function AppCtrl ( $scope, $location ) {

}]);


//restful models
var appModels = angular.module("appModels", []);

appModels.provider('User', function(){
    this.$get = ['ActiveResource', function(ActiveResource) {
        function User(data)
        {
            //if server response data; copy it into this object
            if(!data.error)
            {
                //copy attribute from response to this object
                angular.extend(this, data);
            }

            //original data from server
            Object.defineProperty(this, 'data', {
                get: function()    { return data; },
                set: function(val) { data = val;  }
            });

            this.validates({
                currentPassword: { length: { min: 6, max: 20 }},
                newPassword: { length: { min: 6, max: 20 },  confirmation: true}
            });
        }

        User.inherits(ActiveResource.Base);
        User.api.set('/api/restful');

        return User;
    }];
});

