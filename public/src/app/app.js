//manual bootstrap application after get all information needed
var User;
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

        console.log("USER: ", user);
        User = user;
        $("body").show();
        angular.bootstrap(document, ["mainApp"]);
    });

angular.module( 'mainApp', [
    'templates-app',
    'templates-common',
    'ui.router',
    'mainApp.userAccount',
    'commonDirectives'
])

.config(['$stateProvider', '$urlRouterProvider', function myAppConfig ( $stateProvider, $urlRouterProvider ) {
   $urlRouterProvider.otherwise( '/' );
}])

.run(['$http', '$rootScope', function run ($http, $rootScope) {
    $rootScope.user = User;

    //share object for .dot rule angularjs
    $rootScope.globalObj = {};
}])

.controller( 'mainCtrl', ['$scope', '$location', function AppCtrl ( $scope, $location ) {

}]);

