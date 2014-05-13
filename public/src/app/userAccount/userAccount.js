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

            this.validates({
                currentPassword: { length: { min: 6, max: 20 }},
                newPassword: { length: { min: 6, max: 20 },  confirmation: true}
            });
        }

        Account.inherits(ActiveResource.Base);
        Account.api.set('/api/restful');

        return Account;
    }];
});

app.classy.controller({
    name: "UserAccountController",
    inject: ['$rootScope', '$scope', 'Account'],
    init: function()
    {
        var that = this;

        that.Account.find(11)
            .then(function(response) {
                if(!!response && !response.error)
                {
                    that.$scope.account = response;
                }
            });
    }
});

