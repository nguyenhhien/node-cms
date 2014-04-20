angular.module( 'mainApp', [
  'templates-app',
  'templates-common',
  'mainApp.login',
  'ui.route',
  'ui.router'
])

.config( function myAppConfig ( $stateProvider, $urlRouterProvider ) {
  $urlRouterProvider.otherwise( '/loginPage' );
})

.run( function run () {
})

.controller( 'mainCtrl', function AppCtrl ( $scope, $location ) {
  $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    if ( angular.isDefined( toState.data.pageTitle ) ) {
      $scope.pageTitle = toState.data.pageTitle + ' | auth' ;
    }
  });
});

