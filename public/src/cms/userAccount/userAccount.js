var app = angular.module( 'mainApp.userAccount', [])
.config(['$stateProvider', function config( $stateProvider) {
    $stateProvider
        .state('userAccount', {
            url: '/userAccount',
            templateUrl: 'userAccount/userAccount.tpl.html',
            controller: 'UserAccountController',
            resolve: {}
        });
}]);

app.controller("UserAccountController", ['$rootScope', '$scope', '$http', '$resource', 'Restangular', function($rootScope, $scope, $http, $resource, Restangular){
    //load current user
    function loadCurrentUser()
    {
        Restangular.one('user', $rootScope.user.id).get()
            .then(function(res){
                safeApply($scope, function(){
                    $scope.account = res;
                });
            }, function(error){
                showError(error.stack || error.data || error);
            });
    }

    $scope.loadCurrentUser = loadCurrentUser;

    $scope.loadCurrentUser();

    //auto generated password function
    $scope.generatePassword = function()
    {
        var newPass = generateRandomString(6);

        $scope.account.generatedPassword = $scope.account.newPassword =
            $scope.account.newPasswordConfirmation = newPass;
    };

    //change old password into new password
    $scope.changeNewPassword = function()
    {
        if(!$scope.account.currentPassword || !$scope.account.newPassword || !$scope.account.newPasswordConfirmation)
        {
            return showError("Required field is missing");
        }
        else if($scope.account.newPassword !== $scope.account.newPasswordConfirmation)
        {
            return showError("New password and password confirmation does not match");
        }

        $http.post("/api/user/changePassword",
            {
                email: $scope.account.email,
                password: CryptoJS.MD5($scope.account.currentPassword).toString(),
                newPassword: CryptoJS.MD5($scope.account.newPassword).toString(),
                emailNewPassword: $scope.account.sendEmailNewPassword
            })
            .success(function(response){
                showSuccess("Password has been updated successfully");
            })
            .error(function(error){
                showError(error.data || error);
            });
    };

    //save user account information
    $scope.saveUserAccount = function()
    {
        $scope.account.save()
            .then(function(){
                showSuccess("Account has been updated successfully");
            }, function(error){
                showError(error.stack || error.data || error);
            });
    };

    $scope.uploadCallback = function(res)
    {
        //reload current user
        loadCurrentUser();
    };
}]);


