angular.module( 'mainApp', [
    'templates-app',
    'templates-common',
    'ui.router',
    'mainApp.userAccount',
    'mainApp.user',
    'mainApp.dashboard',
    'mainApp.location',
    'commonDirectives'
])

.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function myAppConfig ( $stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise( '/' );
    $locationProvider.hashPrefix('!');
}])

.run(['$http', '$rootScope', function run ($http, $rootScope) {
    $http.post('/api/users/userInfo')
        .then(function(response){
            var user = response.data;

            if(user.error)
            {
                window.location = "/login.html";
                return console.log("ERROR: ", user.error);
            }

            $rootScope.user = user;
        });

    //share object for .dot rule angularjs
    $rootScope.globalObj = {};

    //initialize socket
    $rootScope.socketServer = io.connect(location.protocol + "//" + location.host, {
        'connect timeout': 500,
        'reconnect': true,
        'reconnection delay': 500,
        'reopen delay': 500,
        'max reconnection attempts': 10
    });
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

