var express             = require('express');
var bcrypt 		        = require("bcrypt");
var models              = require("../models");
var Q                   = require("q");
var async               = require("async");
var utils               = require("../helpers/Utils.js");
var Email               = require("../modules/email");
var request 	        = require("request");

var router = express.Router();

//verify user and password against database
function verifyUserPassword(email, password)
{
    return Q(models.Account.find({where: {email: email, status: UserStatus.Active}}))
        .then(function(user){
            if(!user) return Q.reject({
                error: "User with email: " + email + " not found"
            });
            return [user, Q.nfcall(bcrypt.compare, password, user.password)];
        });
}

//salt and hash password
function saltAndHash(password)
{
    return Q.nfcall(bcrypt.genSalt, 10)
        .then(function(salt){
            return Q.nfcall(bcrypt.hash, password, salt);
        })
}

//validate facebook accesstoken with fbId
function validateFacebookAccessToken(fbId, accessToken)
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

router.post("/changePassword", function(req, res){
    req.assert('email').notEmpty().isEmail();
    req.assert('password').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    verifyUserPassword()
        .spread(function(account, same){
            if(!same) return Q.reject({
                error: "Incorrect old password"
            });

            return [account, saltAndHash(req.param('password'))];
        })
        .spread(function(account, newHash){
            return Q(account.updateAttributes({password: newHash}));
        })
        .then(function(){
            return res.success();
        })
        .fail(function(err){
            return res.error(err);
        })
})

//Send Email for Reset Password
router.post("/forgotPassword", function(req, res){
    req.assert('email').notEmpty().isEmail();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q(models.Account.find({ where: {email: req.param('email')}}))
        .then(function(account){
            if(!account) return Q.reject({
                error: "Account with email: " + req.param('email') + " not found"
            });

            var passwordResetKey = utils.randomString(32);

            //create a records to PasswordRecovery table
            return [passwordResetKey, Q(models.PasswordRecovery.create({
                passwordResetKey: passwordResetKey,
                expiryDate: new Date().addDays(3),
                accountId: account.id
            }))]
        })
        .spread(function(passwordResetKey){
            return Email.sendTemplateEmail(EmailType.UserForgetPassword, req.param('email'), {
                userName: req.param('name') || req.param('email'),
                passwordRecoveryUrl: HOSTURL + "login.html#/resetPassword?passwordResetKey=" + passwordResetKey
            });
        })
        .then(function(){
            res.success();
        })
        .fail(function(err){
            res.error(err);
        })
})

//Reset Password Using Email
router.post("/resetPassword", function(req, res){
    req.assert('passwordResetKey').notEmpty();
    req.assert('password').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q(models.PasswordRecovery.find({where: {passwordResetKey: req.param('passwordResetKey')}}))
        .then(function(recoveryRecord){
            if(!recoveryRecord)
                return Q.reject({
                    error: "Invalid password reset key" + req.param('passwordResetKey')
                });

            return [recoveryRecord.accountId, saltAndHash(req.param('password'))];
        })
        .spread(function(accountId, newHash){
            return Q(models.Account.update({
                        password: newHash
                    }, {id: accountId}));
        })
        .then(function(){
            //delete the activation key
            return Q(models.PasswordRecovery.destroy({
                passwordResetKey: req.param("passwordResetKey")
            }));
        })
        .then(function(){
            return res.success();
        })
        .fail(function(err){
            return res.error(err);
        })
})

router.post("/signin", function(req, res){
    req.assert('email').notEmpty().isEmail();
    req.assert('password').notEmpty();

    var errors = req.validationErrors();

    if (errors) return res.error(utils.formatValidationError(errors));

    verifyUserPassword(req.param('email'), req.param('password'))
        .spread(function(user, same){
            if(!same) return Q.reject({
                error: "Invalid Email or Password"
            });
            //update user last login
            return [user, Q(user.updateAttributes({lastLogin: new Date()}))];
        })
        .spread(function(user){
            return res.success(user);
        })
        .fail(function(err){
            return res.error(err);
        })
});


router.post("/register", function(req, res){
    req.assert('email').notEmpty().isEmail();
    req.assert('name').notEmpty();
    req.assert('password').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q(models.Account.find({ where: {email: req.param('email')} }))
        .then(function(account){
            if(account) return Q.reject({
                error: "Email address is already in used"
            });

            return saltAndHash(req.param('password'))
        })
        .then(function(hash){
            var accountStatus = UserStatus.Active;
            if(Config.Global.needAccountActivation) accountStatus = UserStatus.Inactive;

            return Q(models.Account.create({
                email: req.param('email'),
                name: req.param('name'),
                password: hash,
                status: accountStatus
            }));
        })
        .then(function(newAccount){
            if(Config.Global.needAccountActivation)
            {
                var activationKey = utils.randomString(32);
                return Q(models.AccountActivation.create({
                            accountId: newAccount.id,
                            activationKey: activationKey,
                            expiryDate: new Date().addDays(3)
                        }))
                        .then(function(){
                            return Email.sendTemplateEmail(EmailType.AccountActivation, req.param('email'), {
                                userName: req.param('name') || req.param('email'),
                                activationUrl: HOSTURL + "login.html#/activateAccount?activationKey=" + activationKey
                            });
                        });
            }
            else return Q();
        })
        .then(function(){
            res.success({
                emailActivation: Config.Global.needAccountActivation
            });
        })
        .fail(function(err){
            res.error(err);
        })
})


router.post("/activateAccount", function(req, res){
    req.assert('activationKey').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q(models.AccountActivation.find({where: {
        activationKey: req.param("activationKey"),
        expiryDate: {
            gte: new Date()
        }
    }}))
        .then(function(activationRecord){
            if(!activationRecord) return Q.reject({
                error: "ActivationKey doesn't not exist or has been expired"
            });
            return Q(models.Account.update({
                status: UserStatus.Active
            }, {id: activationRecord.accountId}));
        })
        .then(function(){
            //delete the activation key
            return Q(models.AccountActivation.destroy({
                activationKey: req.param("activationKey")
            }));
        })
        .then(function(){
            res.success();
        })
        .fail(function(err){
            res.error(err);
        });
});

router.post("/facebookRegister", function(req, res){
    req.assert('email').notEmpty().isEmail();
    req.assert('name').notEmpty();
    req.assert('fbId').notEmpty();
    req.assert('accessToken').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q(models.Account.find({where: {fbId: req.param('fbId')}}))
        .then(function(user){
            //if not exist such user, try to register him
            if(!user)
                return validateFacebookAccessToken(req.param('fbId'), req.param('accessToken'))
                            .then(function(valid){
                                //check if that email has been used
                                return Q(models.Account.find({ where: {email: req.param('email')} }));
                            })
                            .then(function(account){
                                if(account) return Q.reject({
                                    error: "Email: " + req.param('email') + ' has been used to register. If you are owner of that account, ' +
                                        'please login to your account page and choose the link facebook option'
                                })
                                else return (models.Account.create({
                                    email: req.param('email'),
                                    name: req.param('name'),
                                    fbId: req.param('fbId'),
                                    status: UserStatus.Active
                                }));
                            })

            //otherwise log user in directly
            else
                return validateFacebookAccessToken(req.param('fbId'), req.param('accessToken'))
                        .then(function(){
                            return Q(user);
                        });
        })
        .then(function(user){
            req.session.user = user;

            //update last logged in timestamp
            Q(models.Account.update({
                lastLogin: new Date()
            }, {id: user.id}));

            res.success(user);
        })
        .fail(function(err){
            res.error(err);
        })
})

router.post("/facebookLogin", function(req, res){
    req.assert('fbId').notEmpty();
    req.assert('accessToken').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q(models.Account.find({where: {fbId: req.param('fbId'), status: UserStatus.Active}}))
        .then(function(user){
            //if not exist such user
            if(!user) return Q.reject({
                code: 404,
                error: "User with fbId " + req.param('fbId') + " not found"
            })
            else return [
                user,
                validateFacebookAccessToken(req.param('fbId'), req.param('accessToken')),
                Q(user.updateAttributes({lastLogin: new Date()}))
            ];
        })
        .spread(function(user){
            req.session.user = user;
            res.success(user);
        })
        .fail(function(err){
            res.error(err);
        })
})

module.exports = router;

