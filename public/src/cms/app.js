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
    'ui.router',
    'restangular',
    'localytics.directives',
    'ui.bootstrap',
    'ngResource',
    'templates-cms_common',
    'templates-cms_main',
    'mainApp.userAccount',
    'mainApp.user',
    'mainApp.dashboard',
    'mainApp.location',
    'mainApp.configuration',
    'mainApp.task',
    'common',
    'commonDirectives',
    'common.fileUpload',
    'common.chatWidget',
    'common.commentThread',
    'common.treeView',
    'common.dropdownTreeView',
    'common.task'
]);

app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', 'RestangularProvider', function myAppConfig ( $stateProvider, $urlRouterProvider, $locationProvider, RestangularProvider) {
    $urlRouterProvider.otherwise( '/' );
    $locationProvider.hashPrefix('!');
    RestangularProvider.setBaseUrl('/api');

    // add a response intereceptor
    RestangularProvider.addResponseInterceptor(function(data, operation, what, url, response, deferred) {
        var extractedData = data;

        if(!_.isArray(data) && _.isObject(data))
        {
            if('rows' in data && 'count' in data)
            {
                extractedData = data.rows;
                extractedData.count = data.count;
            }
        }

        return extractedData;
    });
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


