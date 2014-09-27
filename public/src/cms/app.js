angular.module( 'mainApp', [
    'templates-cms_common',
    'templates-cms_main',
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
    $http.post('/api/user/userInfo')
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
        'max reconnection attempts': 10,
        transports: ['websocket', 'xhr-polling', 'jsonp-polling', 'flashsocket']
    });

    $rootScope.superSocket = new SuperSocket($rootScope.socketServer);

    //this is for test
    $rootScope.socketServer.on("event:connect", function(data){
        console.log("connected", data);
//        $rootScope.superSocket.get("/api/user/onlines", {userId: 1}, function(err, data){
//            console.log("Err, data", err, data.error);
//        });
    });
}])

.controller( 'mainCtrl', ['$scope', '$location', function AppCtrl ( $scope, $location ) {

}]);

