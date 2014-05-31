var app = angular.module( 'mainApp.userAccount', ['appModels', 'ui.router', 'classy', 'ActiveResource', 'utils', 'localytics.directives'])
.config(function config( $stateProvider ) {
    $stateProvider
        .state('userAccount', {
            url: '/userAccount',
            templateUrl: 'userAccount/userAccount.tpl.html',
            controller: 'UserAccountController',
            resolve: {}
        });
});

app.classy.controller({
    name: "UserAccountController",
    inject: ['$rootScope', '$scope', '$http', 'User', 'utils'],
    _showError: function(error)
    {
        var that = this;
        that.utils.$safeApply(that.$rootScope, function(){
            that.$rootScope.globalObj.notification = {
                error: error
            };
        });
    },
    _showMessage: function(msg)
    {
        var that = this;
        that.utils.$safeApply(that.$rootScope, function(){
            that.$rootScope.globalObj.notification = {
                successMessage: msg
            };
        });
    },
    init: function()
    {
        var that = this;

        //load current user info
        that.User.find(that.$rootScope.user.id)
            .then(function(response) {
                if(!response.error)
                {
                    that.$scope.account = response;
                }
                else
                {
                    that._showError("ERROR: " + response.error);
                }
            });

        //get list of all countries
        that.$http.get("/api/countries")
            .then(function(response){
                that.$.countries = response.data.map(function(elem){return elem.name;});
            });
    },
    generatePassword: function()
    {
        var that = this;

        var newPass = that.utils.generateRandomString(6);

        that.$scope.account.generatedPassword = that.$scope.account.newPassword =
            that.$scope.account.newPasswordConfirmation = newPass;
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
                if(!data.error)
                {
                    that._showMessage("SUCCESS: Password has been updated successfully");
                }
                else
                {
                    that._showError("ERROR: " + data.error);
                }
            });
    },
    saveUserAccount: function()
    {
        var that = this;
        that.$scope.account.$update().then(function(response){
            if(response.error)
            {
                that._showError("ERROR: " + response.error);
            }
            else
            {
                that._showMessage("SUCCESS: Account has been updated successfully");
            }
        });
    }
});

