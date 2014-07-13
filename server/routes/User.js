var express             = require('express');
var bcrypt 		        = require("bcrypt");
var Q                   = require("q");
var async               = require("async");
var request 	        = require("request");

var sequelize           = require("../database/sequelize.js");
var utils               = require("../helpers/Utils.js");
var Email               = require("../modules/email");
var modules             = require("../modules/index.js");

var router = express.Router();

router.post("/changePassword", function(req, res){
    req.assert('email').notEmpty().isEmail();
    req.assert('password').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    modules.User.changePassword(req.param('email'), req.param('password'))
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

    modules.User.forgotPasswordRequest(req.param('email'))
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

    modules.User.forgotPasswordRequest(req.param('passwordResetKey'), req.param('password'))
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

    modules.User.verifyUserPassword(req.param('email'), req.param('password'))
        .spread(function(user, same){
            if(!same) return Q.reject({
                error: "Invalid Email or Password"
            });
            //update user last login
            return [user, Q(user.updateAttributes({lastLogin: new Date()}))];
        })
        .spread(function(user){
            req.session.user = user;
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

    modules.User.registerAccount(req.param('email'), req.param('name'), req.param('password'))
        .then(function(){
            res.success({
                emailActivation: Config.Global.needAccountActivation
            });
        })
        .fail(function(err){
            res.error(err);
        })
});


router.post("/activateAccount", function(req, res){
    req.assert('activationKey').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    modules.User.activeAccount(req.param("activationKey"))
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

    modules.User.facebookRegister(req.param('fbId'), req.param('accessToken'), req.param('name'), req.param('email'))
        .then(function(user){
            req.session.user = user;

            //update last logged in timestamp
            Q(sequelize.models.User.update({
                lastLogin: new Date()
            }, {id: user.id}));

            res.success(user);
        })
        .fail(function(err){
            res.error(err);
        })
});

router.post("/googleRegister", function(req, res){
    req.assert('email').notEmpty().isEmail();
    req.assert('name').notEmpty();
    req.assert('googleId').notEmpty();
    req.assert('accessToken').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    modules.User.googleRegister(req.param('googleId'), req.param('accessToken'), req.param('name'), req.param('email'))
        .then(function(user){
            req.session.user = user;

            //update last logged in timestamp
            Q(sequelize.models.User.update({
                lastLogin: new Date()
            }, {id: user.id}));

            res.success(user);
        })
        .fail(function(err){
            res.error(err);
        })
});

router.post("/facebookLogin", function(req, res){
    req.assert('fbId').notEmpty();
    req.assert('accessToken').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q(sequelize.models.User.find({where: {fbId: req.param('fbId'), status: UserStatus.Active}}))
        .then(function(user){
            //if not exist such user
            if(!user) return Q.reject({
                code: 404,
                error: "User with fbId " + req.param('fbId') + " not found"
            })
            else return [
                user,
                modules.User.validateFacebookAccessToken(req.param('fbId'), req.param('accessToken')),
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
});

router.post("/googleLogin", function(req, res){
    req.assert('googleId').notEmpty();
    req.assert('accessToken').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q(sequelize.models.User.find({where: {googleId: req.param('googleId'), status: UserStatus.Active}}))
        .then(function(user){
            //if not exist such user
            if(!user) return Q.reject({
                code: 404,
                error: "User with googleId " + req.param('googleId') + " not found"
            })
            else return [
                user,
                modules.User.validateGoogleAccessToken(req.param('googleId'), req.param('accessToken')),
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
});

//get logged in information + other information for this user
router.post("/userInfo", function(req, res){
    if(!req.session.user) return res.error({
        code: 404,
        error: "user session not found"
    })

    Q(sequelize.models.User.find({where: {id: req.session.user.id, status: UserStatus.Active}}))
        .then(function(user){
            if(!user) return res.error({
                code: 404,
                error: "User with id = " + req.session.user.id + " not found"
            })
            else res.success(user);
        })
        .fail(function(err){
            return res.error(err);
        })
})

//link account to Facebook/Google
router.post("/linkFacebook", function(req, res){
    if(!req.session.user) return res.error({
        code: 404,
        error: "user session not found"
    })

    Q(sequelize.models.User.find({where: {fbId: req.param.fbId}}))
        .then(function(user){
            if(user)
            {
                return Q.reject("The facebook account has been linked to an account with email " + user.email +
                    " .If you want to link your facebook with this account, please disconnect facebook from account " + user.email + " first");
            }

            return Q(sequelize.models.User.update({fbId: req.param.fbId}, {id: req.session.user.id}));
        })
        .then(function(){
            res.success();
        })
        .fail(function(err){
            res.error(err)
        })
})

router.post("/linkGoogle", function(req, res){
    if(!req.session.user) return res.error({
        code: 404,
        error: "user session not found"
    })

    Q(sequelize.models.User.find({where: {googleId: req.param.googleId}}))
        .then(function(user){
            if(user)
            {
                return Q.reject("The google account has been linked to an account with email " + user.email +
                    " .If you want to link your google account with this account, please disconnect google from account " + user.email + " first");
            }

            return Q(sequelize.models.User.update({googleId: req.param.googleId}, {id: req.session.user.id}));
        })
        .then(function(){
            res.success();
        })
        .fail(function(err){
            res.error(err)
        })
})


router.post("/disconnectFacebook", function(req, res){
    if(!req.session.user) return res.error({
        code: 404,
        error: "user session not found"
    })

    Q(sequelize.models.User.update({fbId: ""}, {id: req.session.user.id}))
        .then(function(){
            res.success();
        })
        .fail(function(err){
            res.error(err)
        })
})


router.post("/disconnectGoogle", function(req, res){
    if(!req.session.user) return res.error({
        code: 404,
        error: "user session not found"
    })

    Q(sequelize.models.User.update({googleId: ""}, {id: req.session.user.id}))
        .then(function(){
            res.success();
        })
        .fail(function(err){
            res.error(err)
        })
})

module.exports = router;

