var app = angular.module( 'mainApp.userAccount', ['ui.router', 'classy', 'ActiveResource'])
.config(function config( $stateProvider ) {
    $stateProvider
        .state('userAccount', {
            url: '/userAccount',
            templateUrl: 'userAccount/userAccount.tpl.html',
            controller: 'UserAccountController',
            resolve: {}
        });
});

app.provider('Account', function(){
    this.$get = ['ActiveResource', function(ActiveResource) {
        function Account(data)
        {
            //if server response data; copy it into this object
            if(!data.error)
            {
                //copy attribute from response to this object
                angular.extend(this, data);
            }

            //original data from server
            Object.defineProperty(this, 'data', {
                get: function()    { return data; },
                set: function(val) { data = val;  }
            });
        }

        Account.inherits(ActiveResource.Base);
        Account.api.set('/api/restful');

        //Account.api.showURL = '/api/restful/Account';

        return Account;
    }];
});

app.classy.controller({
    name: "UserAccountController",
    inject: ['$rootScope', '$scope', 'Account'],
    init: function()
    {
        var that = this;

        that.Account.all()
            .then(function(response) {
                that.$scope.account = response;
            });
    }
});

