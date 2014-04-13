angular.module( 'mainApp.home', [
    'ui.router'
])
.config(function config( $stateProvider ) {
    $stateProvider.state( 'home', {
        url: '/signin',
        views: {
            "main": {
                controller: 'SigninCtrl',
                templateUrl: 'home/signin.tpl.html'
            }
        },
        data:{ pageTitle: 'Signin' }
    });
})

.controller( 'SigninCtrl', function SigninController( $scope ) {
});
