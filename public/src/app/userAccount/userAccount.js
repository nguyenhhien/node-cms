var app = angular.module( 'mainApp.userAccount', ['ui.router', 'classy', 'ActiveResource', 'utils', 'localytics.directives'])
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
    inject: ['$rootScope', '$scope', '$http', 'Account', 'utils'],
    init: function()
    {
        var that = this;

        //load current user info
        that.Account.find(that.$rootScope.user.id)
            .then(function(response) {
                if(!response.error)
                {
                    that.$scope.account = response;
                }
                else
                {
                    that.utils.$safeApply(that.$rootScope, function(){
                        that.$rootScope.globalObj.notification = {
                            error: "ERROR: " + response.error
                        };
                    });
                }
            });

        //get list of all countries
        that.$http.get("/api/countries")
            .then(function(response){
                that.$.countries = response.data;
            });
    },
    generatePassword: function()
    {
        var that = this;

        var newPass = that.utils.generateRandomString(6);

        that.$scope.account.generatedPassword = that.$scope.account.newPassword = that.$scope.account.newPasswordConfirmation = newPass;

        //verify that user has enter password
        if(!that.$.account.currentPassword || that.$.account.currentPassword.length < 0)
        {
            that.utils.$safeApply(that.$, function(){
                that.$.currentPasswordRequired = "Must enter current password";
            });
        }

        this.$.account.validate('currentPassword');
    },
    changeNewPassword: function()
    {
        var that = this;

        that.$http.post("/api/users/changePassword", {
            email: that.$.account.email,
            password: CryptoJS.MD5(that.$.account.currentPassword).toString(),
            newPassword: CryptoJS.MD5(that.$.account.newPassword).toString()
        })
            .then(function(response){
                var data = response.data;
                if(!data.error){
                    that.utils.$safeApply(that.$rootScope, function(){
                        that.$rootScope.globalObj.notification = {
                            successMessage: "SUCCESS: Password has been updated successfully"
                        };
                    });
                }
                else
                {
                    that.utils.$safeApply(that.$rootScope, function(){
                        that.$rootScope.globalObj.notification = {
                            error: "ERROR: " + data.error
                        };
                    });
                }
            });
    }
});

