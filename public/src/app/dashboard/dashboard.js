var app = angular.module( 'mainApp.dashboard', [
        'appModels',
        'ui.router',
        'classy',
        'ActiveResource',
        'utils',
        'localytics.directives',
        'ui.bootstrap',
        'mgcrea.ngStrap',
        'templates-common',
        'common.commentThread'
    ])
    .config(function config( $stateProvider ) {
        $stateProvider
            .state('dashboard', {
                url: '/',
                templateUrl: 'dashboard/dashboard.tpl.html',
                controller: 'DashboardController',
                resolve: {}
            });
    });


app.classy.controller({
    name: "DashboardController",
    inject: ['$rootScope', '$scope', '$http', 'User', 'utils'],
    init: function()
    {

    }
});