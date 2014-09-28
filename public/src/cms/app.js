var User;

//get login user -- then bootstrap application
superagent
    .post('/api/user/userInfo')
    .set('Accept', 'application/json')
    .end(function(error, res){
        if(error) {
            window.location = "/login.html";
            return console.log("ERROR: ", error);
        }

        User = res.body;
        angular.bootstrap(document, ["mainApp"]);
    });


var app = angular.module( 'mainApp', [
    'templates-cms_common',
    'templates-cms_main',
    'ui.router',
    'mainApp.userAccount',
    'mainApp.user',
    'mainApp.dashboard',
    'mainApp.location',
    'commonDirectives'
]);

app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function myAppConfig ( $stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise( '/' );
    $locationProvider.hashPrefix('!');
}]);

app.run(['$http', '$rootScope', function run ($http, $rootScope) {
    $rootScope.user = User;

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
    });
}]);

app.controller( 'mainCtrl', ['$scope', '$location', function AppCtrl ( $scope, $location ) {

}]);

