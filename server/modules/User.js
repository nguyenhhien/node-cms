'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');
    var Chance              = require('chance');
    var chance              = new Chance();
    var dateFormat          = require('dateformat');
    var bcrypt 		        = require("bcrypt");
    var request 	        = require("request");

    var Utils               = require("../helpers/Utils.js");
    var mongoose            = require('../database/mongoose.js');
    var sequelize           = require("../database/sequelize.js");
    var utils               = require("../helpers/Utils.js");
    var Email               = require("./email");

    //verify the username and password combination
    module.verifyUserPassword = function(email, password)
    {
        return Q(sequelize.models.User.find({where: {email: email, status: UserStatus.Active}}))
            .then(function(user){
                if(!user) return [null, Q.reject({
                    error: "User with email: " + email + " not found"
                })];
                return [user, Q.nfcall(bcrypt.compare, password, user.password || "")];
            });
    }

    //salt and hash the password
    module.saltAndHash = function(password)
    {
        return Q.nfcall(bcrypt.genSalt, 10)
            .then(function(salt){
                return Q.nfcall(bcrypt.hash, password, salt);
            })
    }

    
    //validate accesstoken methods
    module.validateFacebookAccessToken = function(fbId, accessToken)
    {
        if (!accessToken) return Q.reject({
            error: "accessToken cannot be empty"
        });

        var deferred = Q.defer();

        var url = "https://graph.facebook.com/me?access_token=" + accessToken;
        request({ url: url, json: true }, function(err, httpClient, user){
            if(err) return deferred.reject({
                error: "Facebook access token error: " + err
            });

            if(user.id == fbId) return deferred.resolve(true);

            else return deferred.reject({
                error: "FbId " + fbId + " and Token does not match"
            });
        })

        return deferred.promise;
    }

    module.validateGoogleAccessToken = function(googleId, accessToken)
    {
        if (!accessToken) return Q.reject({
            error: "accessToken cannot be empty"
        });

        var deferred = Q.defer();

        var url = "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + accessToken;
        request({ url: url, json: true }, function(err, httpClient, user){
            if(err) return deferred.reject({
                error: "Facebook access token error: " + err
            });

            if(user.id == googleId) return deferred.resolve(true);

            else return deferred.reject({
                error: "GoogleId " + googleId + " and Token does not match"
            });
        })

        return deferred.promise;
    }


    //main methods
    module.changePassword = function(email, password)
    {
        return module.verifyUserPassword(email, password)
            .spread(function(account, same){
                if(!same) return Q.reject({
                    error: "Incorrect old password"
                });

                return [account, module.saltAndHash(req.param('newPassword'))];
            })
            .spread(function(account, newHash){
                return Q(account.updateAttributes({password: newHash}));
            });
    }
    
    module.forgotPasswordRequest = function(email)
    {
        return Q(sequelize.models.User.find({ where: {email: email}}))
            .then(function(account){
                if(!account) return Q.reject({
                    error: "Account with email: " + email + " not found"
                });

                var passwordResetKey = utils.randomString(32);

                //create a records to PasswordRecovery table
                return [passwordResetKey, Q(sequelize.models.PasswordRecovery.create({
                    passwordResetKey: passwordResetKey,
                    expiryDate: new Date().addDays(3),
                    accountId: account.id
                }))]
            })
            .spread(function(passwordResetKey){
                return Email.sendTemplateEmail(EmailType.UserForgetPassword, email, {
                    userName: email,
                    passwordRecoveryUrl: Config.HOSTURL + "login.html#!/resetPassword?passwordResetKey=" + passwordResetKey
                });
            }); 
    }
    
    module.resetPassword = function(passwordResetKey, password){
        return Q(sequelize.models.PasswordRecovery.find({where: {passwordResetKey: passwordResetKey}}))
            .then(function(recoveryRecord){
                if(!recoveryRecord)
                    return Q.reject({
                        error: "Invalid password reset key" + passwordResetKey
                    });

                return [recoveryRecord.accountId, module.saltAndHash(password)];
            })
            .spread(function(accountId, newHash){
                return Q(sequelize.models.User.update({
                    password: newHash
                }, {id: accountId}));
            })
            .then(function(){
                //delete the activation key
                return Q(sequelize.models.PasswordRecovery.destroy({
                    passwordResetKey: req.param("passwordResetKey")
                }));
            });
    }
    
    module.registerAccount = function(email, name, password)
    {
        return Q(sequelize.models.User.find({ where: {email: email} }))
            .then(function(account){
                if(account) return Q.reject({
                    error: "Email address is already in used"
                });

                return module.saltAndHash(password);
            })
            .then(function(hash){
                var accountStatus = UserStatus.Active;
                if(Config.Global.needAccountActivation) accountStatus = UserStatus.Inactive;

                return Q(sequelize.models.User.create({
                    email: email,
                    name: name,
                    password: hash,
                    status: accountStatus
                }));
            })
            .then(function(newAccount){
                if(Config.Global.needAccountActivation)
                {
                    var activationKey = utils.randomString(32);
                    return Q(sequelize.models.UserActivation.create({
                        accountId: newAccount.id,
                        activationKey: activationKey,
                        expiryDate: new Date().addDays(3)
                    }))
                        .then(function(){
                            return Email.sendTemplateEmail(EmailType.AccountActivation, email, {
                                userName: email,
                                activationUrl: Config.HOSTURL + "login.html#!/activateAccount?activationKey=" + activationKey
                            });
                        });
                }
                else return Q();
            });
    }
    
    module.activeAccount = function(activationKey)
    {
        return Q(sequelize.models.UserActivation.find({where: {
            activationKey: activationKey,
            expiryDate: {
                gte: new Date()
            }
        }}))
            .then(function(activationRecord){
                if(!activationRecord) return Q.reject({
                    error: "ActivationKey doesn't not exist or has been expired"
                });
                
                return Q(sequelize.models.User.update({
                    status: UserStatus.Active
                }, {id: activationRecord.accountId}));
            })
            .then(function(){
                //delete the activation key
                return Q(sequelize.models.UserActivation.destroy({
                    activationKey: activationKey
                }));
            });
    }
    
    module.facebookRegister = function(fbId, accessToken, name, email)
    {
        return Q(sequelize.models.User.find({where: {fbId: fbId}}))
            .then(function(user){
                //if not exist such user, try to register him
                if(!user)
                {
                    return module.validateFacebookAccessToken(fbId, accessToken)
                        .then(function(valid){
                            //check if that email has been used
                            return Q(sequelize.models.User.find({ where: {email: email} }));
                        })
                        .then(function(account){
                            if(account) return Q.reject({
                                error: "Email: " + email + ' has been used to register. If you are owner of that account, ' +
                                    'please login to your account page and click to link-to-facebook to link to your facebook account'
                            })

                            else return (sequelize.models.User.create({
                                email: email,
                                name: name,
                                fbId: fbId,
                                status: UserStatus.Active
                            }));
                        })

                }                  
                //otherwise log user in directly
                else
                {
                    return module.validateFacebookAccessToken(fbId, accessToken)
                        .then(function(){
                            return Q(user);
                        });   
                }                    
            })
    }
    
    module.googleRegister = function(googleId, accessToken, name, email)
    {
        return Q(sequelize.models.User.find({where: {googleId: googleId}}))
            .then(function(user){
                if(!user)
                {
                    return module.validateGoogleAccessToken(googleId, accessToken)
                        .then(function(valid){
                            //check if that email has been used
                            return Q(sequelize.models.User.find({ where: {email: email} }));
                        })
                        .then(function(account){
                            if(account) return Q.reject({
                                error: "Email: " + email + ' has been used to register. If you are owner of that account, ' +
                                    'please login to your account page and click link-to-google to link to your google account'
                            })

                            else return (sequelize.models.User.create({
                                email: email,
                                name: name,
                                googleId: googleId,
                                status: UserStatus.Active
                            }));
                        })

                }
                //otherwise log user in directly
                else
                {
                    return module.validateGoogleAccessToken(googleId, accessToken)
                        .then(function(){
                            return Q(user);
                        });
                }
            });
    }

}(exports));