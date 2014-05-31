var app = angular.module( 'mainApp.user', [
        'appModels',
        'ui.router',
        'classy',
        'ActiveResource',
        'utils',
        'localytics.directives',
        'ui.bootstrap',
        'mgcrea.ngStrap'
    ])
    .config(function config( $stateProvider ) {
        $stateProvider
            .state('users', {
                url: '/users',
                templateUrl: 'user/search.tpl.html',
                controller: 'UserSearchController',
                resolve: {}
            })
            .state('users.details', {
                url: '/users/:id',
                templateUrl: 'user/edit.tpl.html',
                controller: 'UserEditController',
                resolve: {}
            });
    });

app.classy.controller({
    name: "UserSearchController",
    inject: ['$rootScope', '$scope', '$http', 'User', 'utils'],
    getUsers: function(offset, limit)
    {
        var that = this;
        that.User.where({offset: offset, limit: limit})
            .then(function(response){
                that.$.users = response.rows;
                that.$.totalItems = response.count;
            });
    },
    watch: {
        'currentPage': function(currentPage)
        {
            if(!currentPage)
            {
                return;
            }

            //load current page
            this.getUsers((currentPage-1)*this.$.itemsPerPage, this.$.itemsPerPage);
        }
    },
    init: function(){
        var that = this;

        that.$.currentPage = 1; //current page idx
        that.$.itemsPerPage = 10; //number of items per pages
    }
});

app.classy.controller({
    name: "UserEditController",
    inject: ['$rootScope', '$scope', '$http', 'User', 'utils'],
    init: function(){
        var that = this;
        that.User.all()
            .then(function(response){
                that.$.users = response;
            });
    }
});