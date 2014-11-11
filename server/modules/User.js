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
    var bcrypt 		        = require("bcrypt-nodejs");
    var request 	        = require("request");
    var superagent          = require('superagent');
    var beaver              = require("../../Beaver.js");
    var Email               = require("./Email");

    //verify the username and password combination
    module.verifyUserPassword = Q.async(function*(email, password){
        var user = yield beaver.sequelizeModels.User.find({where: {email: email, status: UserStatus.Active}});

        if(!user) return [null, yield Q.reject({
            error: "User with email: " + email + " not found"
        })];

        return [user, yield Q.nfcall(bcrypt.compare, password, user.password || "")];
    });

    //salt and hash the password
    module.saltAndHash = Q.async(function*(password)
    {
        var salt = yield Q.nfcall(bcrypt.genSalt, 10);
        return yield Q.nfcall(bcrypt.hash, password, salt, null);
    });

    
    //validate facebook access token
    module.validateFacebookAccessToken = Q.async(function*(fbId, accessToken)
    {
        if (!accessToken) return yield Q.reject({
            error: "accessToken cannot be empty"
        });

        var url = "https://graph.facebook.com/me?access_token=" + accessToken;

        var response = yield Q.ninvoke(
            superagent.get(url)
                .set('Accept', 'application/json'), 'end');

        var user = response.body;

        if(user.id == fbId) return yield Q(true);
        else return yield Q.reject({
            error: "FbId " + fbId + " and Token does not match"
        });
    });

    module.validateGoogleAccessToken = Q.async(function*(googleId, accessToken)
    {
        if (!accessToken) return yield Q.reject({
            error: "accessToken cannot be empty"
        });

        var url = "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + accessToken;

        var response = yield Q.ninvoke(
            superagent.get(url)
                .set('Accept', 'application/json'), 'end');

        var user = response.body;

        if(user.id == googleId) return yield Q(true);
        else return yield Q.reject({
            error: "GoogleId " + googleId + " and Token does not match"
        });
    });

    //main methods
    module.changePassword = Q.async(function*(email, password, newPasword)
    {
        var results = yield module.verifyUserPassword(email, password);
        if(!results[1]) return Q.reject({
            error: "Incorrect old password"
        });

        var account = results[0];
        var newHash = yield module.saltAndHash(newPasword);

        yield Q(account.updateAttributes({password: newHash}));
    });
    
    module.forgotPasswordRequest = function(email)
    {
        return Q(beaver.sequelizeModels.User.find({ where: {email: email}}))
            .then(function(account){
                if(!account) return Q.reject({
                    error: "Account with email: " + email + " not found"
                });

                var passwordResetKey = chance.hash({length: 25});

                //create a records to PasswordRecovery table
                return [passwordResetKey, Q(beaver.sequelizeModels.PasswordRecovery.create({
                    passwordResetKey: passwordResetKey,
                    expiryDate: new Date().addDays(3),
                    accountId: account.id
                }))]
            })
            .spread(function(passwordResetKey){
                return Email.sendTemplateEmail(EmailType.UserForgetPassword, email, {
                    userName: email,
                    passwordRecoveryUrl: beaver.config.global.origin + "login.html#!/resetPassword?passwordResetKey=" + passwordResetKey
                });
            });
    }
    
    module.resetPassword = function(passwordResetKey, password){
        return Q(beaver.sequelizeModels.PasswordRecovery.find({where: {passwordResetKey: passwordResetKey}}))
            .then(function(recoveryRecord){
                if(!recoveryRecord)
                    return Q.reject({
                        error: "Invalid password reset key" + passwordResetKey
                    });

                return [recoveryRecord.accountId, module.saltAndHash(password)];
            })
            .spread(function(accountId, newHash){
                return Q(beaver.sequelizeModels.User.update({
                    password: newHash
                }, {id: accountId}));
            })
            .then(function(){
                //delete the activation key
                return Q(beaver.sequelizeModels.PasswordRecovery.destroy({
                    passwordResetKey: req.param("passwordResetKey")
                }));
            });
    }
    
    module.registerAccount = function(email, name, password)
    {
        return Q(beaver.sequelizeModels.User.find({ where: {email: email} }))
            .then(function(account){
                if(account) return Q.reject({
                    error: "Email address is already in used"
                });

                return module.saltAndHash(password);
            })
            .then(function(hash){
                var accountStatus = UserStatus.Active;
                if(beaver.config.global.needAccountActivation) accountStatus = UserStatus.Inactive;

                return Q(beaver.sequelizeModels.User.create({
                    email: email,
                    name: name,
                    password: hash,
                    status: accountStatus
                }));
            })
            .then(function(newAccount){
                if(beaver.config.global.needAccountActivation)
                {
                    var activationKey = chance.hash({length: 25});

                    return Q(beaver.sequelizeModels.UserActivation.create(
                        {
                            userId: newAccount.id,
                            activationKey: activationKey,
                            expiryDate: new Date().addDays(3)
                        }))
                        .then(function(){
                            return Email.sendTemplateEmail(EmailType.AccountActivation, email, {
                                userName: email,
                                activationUrl: beaver.config.global.origin + "login.html#!/activateAccount?activationKey=" + activationKey
                            });
                        });
                }
                else return Q();
            });
    };
    
    module.activeAccount = function(activationKey)
    {
        return Q(
            beaver.sequelizeModels.UserActivation.find({where: {
                activationKey: activationKey,
                expiryDate: {
                    gte: new Date()
                }
            }}))
            .then(function(activationRecord){
                if(!activationRecord) return Q.reject({
                    error: "ActivationKey doesn't not exist or has been expired"
                });
                
                return Q(beaver.sequelizeModels.User.update({
                    status: UserStatus.Active
                }, {id: activationRecord.userId}));
            })
            .then(function(){
                //delete the activation key
                return Q(beaver.sequelizeModels.UserActivation.destroy({
                    activationKey: activationKey
                }));
            });
    };
    
    module.facebookRegister = Q.async(function*(fbId, accessToken, name, email)
    {
        var user = yield beaver.sequelizeModels.User.find({where: {fbId: fbId}});

        if(!user)
        {
            var valid = yield module.validateFacebookAccessToken(fbId, accessToken);
            var account = yield beaver.sequelizeModels.User.find({ where: {email: email} });

            if(account) return Q.reject({
                error: "Email: " + email + ' has been used to register. If you are owner of that account, ' +
                    'please login to your account page and click to link-to-facebook to link to your facebook account'
            })

            else return yield beaver.sequelizeModels.User.create({
                email: email,
                name: name,
                fbId: fbId,
                status: UserStatus.Active
            });
        }
        //otherwise log user in directly
        else
        {
            yield module.validateFacebookAccessToken(fbId, accessToken);
            return Q(user);
        }
    });
    
    module.googleRegister = Q.async(function*(googleId, accessToken, name, email)
    {
        var user = yield beaver.sequelizeModels.User.find({where: {googleId: googleId}});

        if(!user)
        {
            var valid = yield module.validateGoogleAccessToken(googleId, accessToken);
            var account = yield beaver.sequelizeModels.User.find({ where: {email: email} });

            if(account) return Q.reject({
                error: "Email: " + email + ' has been used to register. If you are owner of that account, ' +
                    'please login to your account page and click link-to-google to link to your google account'
            })

            else {
                return yield beaver.sequelizeModels.User.create({
                    email: email,
                    name: name,
                    googleId: googleId,
                    status: UserStatus.Active
                });
            }
        }
        //otherwise log user in directly
        else
        {
            yield module.validateGoogleAccessToken(googleId, accessToken);
            return Q(user);
        }
    });

}(exports));