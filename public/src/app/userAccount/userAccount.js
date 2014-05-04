angular.module( 'mainApp.userAccount', ['ui.router'])
.config(function config( $stateProvider ) {
    $stateProvider
        .state('userAccount', {
            url: '/userAccount',
            templateUrl: 'userAccount/userAccount.tpl.html',
            controller: 'UserAccountController',
            resolve: {}
        });
})
.controller( 'UserAccountController', function UserAccountController( $scope ) {
});
