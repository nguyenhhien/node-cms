'use strict';

(function(module) {
    var Q                   = require("q");
    var async               = require("async");
    var beaver              = require("../../Beaver.js");

    module.changePassword = function(req, res)
    {
        req.assert('email').notEmpty().isEmail();
        req.assert('password').notEmpty();
        req.assert('newPassword').notEmpty();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        Q.async(
            function*(){
                yield beaver.modules.User.changePassword(req.param('email'), req.param('password'), req.param('newPassword'));
                return res.success();
            })()
            .fail(function(error){
                return res.error(error.stack || error);
            });
    }

    module.forgotPassword = function(req, res)
    {
        req.assert('email').notEmpty().isEmail();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        Q.async(
            function*(){
                yield beaver.modules.User.forgotPasswordRequest(req.param('email'));
                return res.success();
            })()
            .fail(function(error){
                return res.error(error.stack || error);
            });
    }

    module.resetPassword = function(req, res)
    {
        req.assert('passwordResetKey').notEmpty();
        req.assert('password').notEmpty();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        Q.async(
            function*(){
                yield beaver.modules.User.forgotPasswordRequest(req.param('passwordResetKey'), req.param('password'));
                return res.success();
            })()
            .fail(function(error){
                return res.error(error.stack || error);
            });
    }

    module.signin = function(req, res)
    {
        req.assert('email').notEmpty().isEmail();
        req.assert('password').notEmpty();

        var errors = req.validationErrors();

        if (errors) return res.json(beaver.utils.formatValidationError(errors));

        Q.async(
            function*(){
                var results = yield beaver.modules.User.verifyUserPassword(req.param('email'), req.param('password'));
                var user = results[0];

                if(!results[1]) return Q.reject({
                    error: "Invalid Email or Password"
                });

                yield Q(user.updateAttributes({lastLogin: new Date()}));

                req.session.user = user;
                return res.success(user);
            })()
            .fail(function(error){
                return res.error({
                    error: error.stack || error
                });
            });
    }

    //sign out
    module.signout = function(req, res)
    {
        //clear cookies
        res.clearCookie('connect.sid');

        //destroy session + success
        req.session.destroy(function(e){
            res.success();
        });
    }

    module.register = function(req, res)
    {
        req.assert('email').notEmpty().isEmail();
        req.assert('name').notEmpty();
        req.assert('password').notEmpty();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        Q.async(
            function*(){
                yield beaver.modules.User.registerAccount(req.param('email'), req.param('name'), req.param('password'));
                return res.success({
                    emailActivation: beaver.config.global.needAccountActivation
                });
            })()
            .fail(function(error){
                return res.error(error.stack || error);
            });
    }

    module.activateAccount = function(req, res)
    {
        req.assert('activationKey').notEmpty();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        Q.async(
            function*(){
                yield beaver.modules.User.activeAccount(req.param("activationKey"));
                return res.success();
            })()
            .fail(function(error){
                return res.error(error.stack || error);
            });
    }

    //TODO: right now, we made an assumption that facebook/google returned email address; but in reality they might not
    module.facebookRegister = function(req, res)
    {
        req.assert('email').notEmpty().isEmail();
        req.assert('name').notEmpty();
        req.assert('fbId').notEmpty();
        req.assert('accessToken').notEmpty();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        Q.async(
            function*(){
                var user = yield beaver.modules.User.facebookRegister(req.param('fbId'), req.param('accessToken'), req.param('name'), req.param('email'));
                req.session.user = user;

                yield beaver.sequelizeModels.User.update({lastLogin: new Date()}, {id: user.id});

                return res.success(user);
            })()
            .fail(function(error){
                return res.error(error.stack || error);
            });
    }

    module.googleRegister = function(req, res)
    {
        req.assert('email').notEmpty().isEmail();
        req.assert('name').notEmpty();
        req.assert('googleId').notEmpty();
        req.assert('accessToken').notEmpty();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        Q.async(
            function*(){
                var user = yield beaver.modules.User.googleRegister(req.param('googleId'), req.param('accessToken'), req.param('name'), req.param('email'));
                req.session.user = user;

                yield beaver.sequelizeModels.User.update({lastLogin: new Date()}, {id: user.id});

                return res.success(user);
            })()
            .fail(function(error){
                return res.error(error.stack || error);
            });
    }

    module.facebookLogin = function(req, res)
    {
        req.assert('fbId').notEmpty();
        req.assert('accessToken').notEmpty();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        Q.async(
            function*(){
                var user = yield beaver.sequelizeModels.User.find({where: {fbId: req.param('fbId'), status: UserStatus.Active}});

                if(!user) return Q.reject({
                    code: 404,
                    error: "User with fbId " + req.param('fbId') + " not found"
                })

                var validateStatus = yield beaver.modules.User.validateFacebookAccessToken(req.param('fbId'), req.param('accessToken'));
                if(validateStatus)
                {
                    yield beaver.sequelizeModels.User.update({lastLogin: new Date()}, {id: user.id});
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
    }

    module.googleLogin = function(req, res)
    {
        req.assert('googleId').notEmpty();
        req.assert('accessToken').notEmpty();

        var errors = req.validationErrors();
        if (errors) return res.error(beaver.utils.formatValidationError(errors));

        Q.async(
            function*(){
                var user = yield beaver.sequelizeModels.User.find({where: {googleId: req.param('googleId'), status: UserStatus.Active}});

                if(!user) return Q.reject({
                    code: 404,
                    error: "User with googleId " + req.param('googleId') + " not found"
                })

                var validateStatus = yield beaver.modules.User.validateGoogleAccessToken(req.param('googleId'), req.param('accessToken'));
                if(validateStatus)
                {
                    yield beaver.sequelizeModels.User.update({lastLogin: new Date()}, {id: user.id});
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
    }

    module.userInfo = function(req, res)
    {
        if(!req.session.user) return res.error({
            code: 404,
            error: "user session not found"
        })

        Q.async(
            function*(){
                var user = yield Q(beaver.sequelizeModels.User.find({where: {id: req.session.user.id, status: UserStatus.Active}}));

                if(!user) return res.error({
                    code: 404,
                    error: "User with id = " + req.session.user.id + " not found"
                })
                else res.success(user);
            })()
            .fail(function(error){
                return res.error(error.stack || error);
            });
    }

    module.linkFacebook = function(req, res)
    {
        if(!req.session.user) return res.error({
            code: 404,
            error: "user session not found"
        })

        Q(beaver.sequelizeModels.User.find({where: {fbId: req.param.fbId}}))
            .then(function(user){
                if(user)
                {
                    return Q.reject("The facebook account has been linked to an account with email " + user.email +
                        " .If you want to link your facebook with this account, please disconnect facebook from account " + user.email + " first");
                }

                return Q(beaver.sequelizeModels.User.update({fbId: req.param.fbId}, {id: req.session.user.id}));
            })
            .then(function(){
                res.success();
            })
            .fail(function(error){
                res.error(error.stack || error)
            });
    }

    module.linkGoogle = function(req, res)
    {
        if(!req.session.user) return res.error({
            code: 404,
            error: "user session not found"
        })

        Q(beaver.sequelizeModels.User.find({where: {googleId: req.param.googleId}}))
            .then(function(user){
                if(user)
                {
                    return Q.reject("The google account has been linked to an account with email " + user.email +
                        " .If you want to link your google account with this account, please disconnect google from account " + user.email + " first");
                }

                return Q(beaver.sequelizeModels.User.update({googleId: req.param.googleId}, {id: req.session.user.id}));
            })
            .then(function(){
                res.success();
            })
            .fail(function(error){
                res.error(error.stack || error)
            });
    }

    module.disconnectFacebook = function(req, res)
    {
        if(!req.session.user) return res.error({
            code: 404,
            error: "user session not found"
        })

        Q(beaver.sequelizeModels.User.update({fbId: ""}, {id: req.session.user.id}))
            .then(function(){
                res.success();
            })
            .fail(function(error){
                res.error(error.stack || error)
            });
    }

    module.disconnectGoogle = function(req, res)
    {
        if(!req.session.user) return res.error({
            code: 404,
            error: "user session not found"
        })

        Q(beaver.sequelizeModels.User.update({googleId: ""}, {id: req.session.user.id}))
            .then(function(){
                res.success();
            })
            .fail(function(error){
                res.error(error.stack || error)
            });
    }
}(exports));