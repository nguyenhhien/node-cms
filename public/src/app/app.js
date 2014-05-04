angular.module( 'mainApp', [
  'templates-app',
  'templates-common',
  'ui.router',
  'mainApp.userAccount'
])

.config( function myAppConfig ( $stateProvider, $urlRouterProvider ) {
   $urlRouterProvider.otherwise( '/' );
})

.run( function run () {
})

.controller( 'mainCtrl', function AppCtrl ( $scope, $location ) {

});

