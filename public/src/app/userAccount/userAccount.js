var app = angular.module( 'mainApp.userAccount', ['ui.router', 'classy', 'utils', 'localytics.directives'])
.config(function config( $stateProvider ) {
    $stateProvider
        .state('userAccount', {
            url: '/userAccount',
            templateUrl: 'userAccount/userAccount.tpl.html',
            controller: 'UserAccountController',
            resolve: {}
        });
});

app.controller("UserAccountController", ['$rootScope', '$scope', '$http', 'utils', '$resource', function($rootScope, $scope, $http, utils, $resource){
    var UserResource = $resource('/api/user/:id', {id: '@_id'});
    var response = UserResource.get({id:$rootScope.user.id}, function() {
        if(!response.error)
        {
            $scope.account = response;
        }
        else
        {
            _showError("ERROR: " + response.error);
        }
    });

    var _showError = function(error)
    {
        utils.$safeApply(that.$rootScope, function(){
            $rootScope.globalObj.notification = {
                error: error
            };
        });
    };

    var _showMessage = function(msg)
    {
        utils.$safeApply(that.$rootScope, function(){
            that.$rootScope.globalObj.notification = {
                successMessage: msg
            };
        });
    };

    $scope.generatePassword = function()
    {
        var newPass = utils.generateRandomString(6);

        $scope.account.generatedPassword = $scope.account.newPassword =
            $scope.account.newPasswordConfirmation = newPass;
    };
    
    $scope.changeNewPassword = function()
    {
        $http.post("/api/user/changePassword",
            {
                email: $.account.email,
                password: CryptoJS.MD5($.account.currentPassword).toString(),
                newPassword: CryptoJS.MD5($.account.newPassword).toString()
            })
            .then(function(response){
                var data = response.data;
                if(!data.error)
                {
                    _showMessage("SUCCESS: Password has been updated successfully");
                }
                else
                {
                    _showError("ERROR: " + data.error);
                }
            }); 
    };

    $scope.saveUserAccount = function()
    {
        $scope.account.$update().then(function(response){
            if(response.error)
            {
                _showError("ERROR: " + response.error);
            }
            else
            {
                _showMessage("SUCCESS: Account has been updated successfully");
            }
        });
    };
}]);


