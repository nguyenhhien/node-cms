var LoggedInUser;

//get login user -- then bootstrap application
$.post('/api/user/userInfo')
    .done(function(res){
        LoggedInUser = res;
        $("body").show();
        angular.bootstrap(document, ["mainApp"]);
    })
    .fail(function(error){
        if(error) {
            window.location = "/login.html";
            return console.log("ERROR: ", error);
        }
    });

var app = angular.module( 'mainApp', [
    'templates-cms_common',
    'templates-cms_main',
    'ui.router',
    'mainApp.userAccount',
    'mainApp.user',
    'mainApp.dashboard',
    'mainApp.location',
    'common',
    'commonDirectives',
    'angular-data.DS',
    'common.fileUpload'
]);

app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function myAppConfig ( $stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise( '/' );
    $locationProvider.hashPrefix('!');
}]);

app.run(['$http', '$rootScope', function run ($http, $rootScope) {
    $rootScope.user = LoggedInUser;

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

    //logout function
    $rootScope.logout = function()
    {
        $http.post("/api/user/signout")
            .success(function(res){
                if(res.error)
                {
                    return console.log("[ERROR], unable to sign out");
                }

                //redirect to login page
                window.location = "/login.html";
            });
    };

    $rootScope.countries = countriesList;
}]);

app.controller( 'mainCtrl', ['$scope', '$location', function AppCtrl ( $scope, $location ) {

}]);

//models
app.factory('User', ['DS', function (DS) {
    return DS.defineResource({
        name: 'user',
        baseUrl: 'api'
    });
}]);

