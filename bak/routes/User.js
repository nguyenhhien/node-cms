var express             = require('express');
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
    req.assert('newPassword').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q.async(function*(){
        yield modules.User.changePassword(req.param('email'), req.param('password'), req.param('newPassword'));
        return res.success();
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
})

//Send Email for Reset Password
router.post("/forgotPassword", function(req, res){
    req.assert('email').notEmpty().isEmail();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q.async(function*(){
        yield modules.User.forgotPasswordRequest(req.param('email'));
        return res.success();
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
})

//Reset Password Using Email
router.post("/resetPassword", function(req, res){
    req.assert('passwordResetKey').notEmpty();
    req.assert('password').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q.async(function*(){
        yield modules.User.forgotPasswordRequest(req.param('passwordResetKey'), req.param('password'));
        return res.success();
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
})

router.post("/signin", function(req, res){
    req.assert('email').notEmpty().isEmail();
    req.assert('password').notEmpty();

    var errors = req.validationErrors();

    if (errors) return res.error(utils.formatValidationError(errors));

    Q.async(function*(){
        var results = yield modules.User.verifyUserPassword(req.param('email'), req.param('password'));
        var user = results[0];

        if(!results[1]) return Q.reject({
            error: "Invalid Email or Password"
        });

        yield Q(user.updateAttributes({lastLogin: new Date()}));

        req.session.user = user;
        return res.success(user);
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
});


router.post("/register", function(req, res){
    req.assert('email').notEmpty().isEmail();
    req.assert('name').notEmpty();
    req.assert('password').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q.async(function*(){
        yield modules.User.registerAccount(req.param('email'), req.param('name'), req.param('password'));
        return res.success({
            emailActivation: Config.Global.needAccountActivation
        });
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
});


router.post("/activateAccount", function(req, res){
    req.assert('activationKey').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q.async(function*(){
        yield modules.User.activeAccount(req.param("activationKey"));
        return res.success();
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
});

router.post("/facebookRegister", function(req, res){
    req.assert('email').notEmpty().isEmail();
    req.assert('name').notEmpty();
    req.assert('fbId').notEmpty();
    req.assert('accessToken').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q.async(function*(){
        var user = yield modules.User.facebookRegister(req.param('fbId'), req.param('accessToken'), req.param('name'), req.param('email'));
        req.session.user = user;

        yield sequelize.models.User.update({lastLogin: new Date()}, {id: user.id});

        return res.success(user);
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
});

router.post("/googleRegister", function(req, res){
    req.assert('email').notEmpty().isEmail();
    req.assert('name').notEmpty();
    req.assert('googleId').notEmpty();
    req.assert('accessToken').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q.async(function*(){
        var user = yield modules.User.googleRegister(req.param('googleId'), req.param('accessToken'), req.param('name'), req.param('email'));
        req.session.user = user;

        yield sequelize.models.User.update({lastLogin: new Date()}, {id: user.id});

        return res.success(user);
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
});

router.post("/facebookLogin", function(req, res){
    req.assert('fbId').notEmpty();
    req.assert('accessToken').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q.async(function*(){
        var user = yield sequelize.models.User.find({where: {fbId: req.param('fbId'), status: UserStatus.Active}});

        if(!user) return Q.reject({
            code: 404,
            error: "User with fbId " + req.param('fbId') + " not found"
        })

        var validateStatus = yield modules.User.validateFacebookAccessToken(req.param('fbId'), req.param('accessToken'));
        if(validateStatus)
        {
            yield sequelize.models.User.update({lastLogin: new Date()}, {id: user.id});
            req.session.user = user;
            res.success(user);
        }
        else
        {
            return Q.reject({
                error: "Invalid access token"
            })
        }
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
});

router.post("/googleLogin", function(req, res){
    req.assert('googleId').notEmpty();
    req.assert('accessToken').notEmpty();

    var errors = req.validationErrors();
    if (errors) return res.error(utils.formatValidationError(errors));

    Q.async(function*(){
        var user = yield sequelize.models.User.find({where: {googleId: req.param('googleId'), status: UserStatus.Active}});

        if(!user) return Q.reject({
            code: 404,
            error: "User with googleId " + req.param('googleId') + " not found"
        })

        var validateStatus = yield modules.User.validateGoogleAccessToken(req.param('googleId'), req.param('accessToken'));
        if(validateStatus)
        {
            yield sequelize.models.User.update({lastLogin: new Date()}, {id: user.id});
            req.session.user = user;
            res.success(user);
        }
        else
        {
            return Q.reject({
                error: "Invalid access token"
            })
        }
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
});

//get logged in information + other information for this user
router.post("/userInfo", function(req, res){
    if(!req.session.user) return res.error({
        code: 404,
        error: "user session not found"
    })

    Q.async(function*(){
        var user = yield Q(sequelize.models.User.find({where: {id: req.session.user.id, status: UserStatus.Active}}));

        if(!user) return res.error({
            code: 404,
            error: "User with id = " + req.session.user.id + " not found"
        })
        else res.success(user);
    })()
    .fail(function(error){
        return res.error(error.stack || error);
    });
});

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
});

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
});


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
});


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
});

module.exports = router;

