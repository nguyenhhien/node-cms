var Config              = require("../../config.js").test;

var Q                   = require("q");
var _                   = require('lodash-node');
var winston             = require('winston');
var async               = require('async');
var path                = require('path');
var io                  = require('socket.io-client');
var superagent          = require('superagent');
var agent               = superagent.agent();
var crypto              = require('crypto')
var cookie              = require('cookie');
var cookieParser        = require("cookie-parser");

var dbmock              = require('../../mocks/databasemocks');
var mongoose            = require('../../database/mongoose.js');
var sequelize           = require("../../database/sequelize.js");
var redis               = require("../../database/redis.js");
var mongo               = require("../../database/mongo.js");
var modules             = require("../../modules/index.js");

describe('user api test suite', function(){
    beforeEach(function(done){
        Q.all([redis.init(), sequelize.init()])
            .then(function(){
                done();
            })
            .fail(function(error){
                winston.error(error.stack || error);
                done(false);
            });
    });

    afterEach(function(done){
        Q.all([
                redis.flushdb(),
                Q(sequelize.client.query("DELETE FROM User"))
            ])
            .then(function(){
                dbmock.closeRedis();
                sequelize.close();
                done();
            })
            .fail(function(error){
                winston.error(error.stack || error);
                done(false);
            });
    });

    var user = {
        email: 'abraham_lincoln@gmail.com',
        name: 'Abraham Lincoln',
        password: crypto.createHash('md5').update('111111').digest('hex'),
        rawPassword: '111111'
    };

    it('validate facebook access token', function(done){
        Q.async(function*(){
            var url = 'https://graph.facebook.com/oauth/access_token?grant_type=client_credentials&client_id='
                + Config.Facebook.clientId + "&client_secret=" + Config.Facebook.clientSecret;

            var response = yield Q.ninvoke(
                superagent.get(url)
                    .set('Accept', 'application/json'), 'end');

            var appAccessToken = response.text && response.text.replace("access_token=", "");

            var testUserResponse = yield Q.ninvoke(
                superagent.get("https://graph.facebook.com/" + Config.Facebook.clientId
                    + "/accounts/test-users?access_token="+appAccessToken)
                    .set('Accept', 'application/json'), 'end');

            var testUser = _.find(testUserResponse.body && testUserResponse.body.data, function(elem){
                return elem.id == Config.Facebook.testUser.userId;
            });

            expect(testUser).not.toBe(null);

            //validate access token
            var validStatus = yield modules.User.validateFacebookAccessToken(
                Config.Facebook.testUser.userId, testUser.access_token
            );
            expect(validStatus).toBe(true);

            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done();
        });
    });

    it('exchange and validate google access token', function(done){
        Q.async(function*(){
            var url = 'https://accounts.google.com/o/oauth2/token';
            var response = yield Q.ninvoke(
                superagent.post(url)
                    .send({
                        client_id: Config.Google.clientId,
                        client_secret: Config.Google.clientSecret,
                        refresh_token: Config.Google.testUser.refreshToken,
                        grant_type: 'refresh_token'
                    })
                    .set('Content-Type', 'application/x-www-form-urlencoded') //must set content-type, other wise won't work
                    .set('Accept', 'application/json'), 'end');

            var accessToken = response.body && response.body.access_token;

            //validate access token
            var validStatus = yield modules.User.validateGoogleAccessToken(
                Config.Google.testUser.userId, accessToken
            );

            expect(validStatus).toBe(true);

            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done();
        })
    });

    it('it should register new account', function(done){
        Q.async(function*(){
            var response = (yield Q.ninvoke(superagent.post(Config.HOSTURL + 'api/users/register')
                .send(user)
                .set('Accept', 'application/json'), 'end')).body;

            expect(response.emailActivation).not.toBe(null);
            var newUser = yield sequelize.models.User.find({where: {email: user.email}});

            expect(newUser).not.toBe(null);
            expect(newUser.email).toEqual(user.email);
            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done();
        });
    });

    it('it should be able to register facebook account', function(done){
        Q.async(function*(){
            var url = 'https://graph.facebook.com/oauth/access_token?grant_type=client_credentials&client_id='
                + Config.Facebook.clientId + "&client_secret=" + Config.Facebook.clientSecret;

            var response = yield Q.ninvoke(
                superagent.get(url)
                    .set('Accept', 'application/json'), 'end');

            var appAccessToken = response.text && response.text.replace("access_token=", "");

            var testUserResponse = yield Q.ninvoke(
                superagent.get("https://graph.facebook.com/" + Config.Facebook.clientId
                        + "/accounts/test-users?access_token="+appAccessToken)
                    .set('Accept', 'application/json'), 'end');

            var testUser = _.find(testUserResponse.body && testUserResponse.body.data, function(elem){
                return elem.id == Config.Facebook.testUser.userId;
            });

            expect(testUser).not.toBe(null);

            //using test user access token to register facebook account
            yield Q.ninvoke(
                superagent.post(Config.HOSTURL + 'api/users/facebookRegister')
                    .send({email: testUser.email, name: testUser.name, fbId: testUser.id, accessToken: testUser.access_token})
                    .set('Accept', 'application/json'), 'end');


            //then login using the access token
            response = yield Q.ninvoke(
                superagent.post(Config.HOSTURL + 'api/users/facebookLogin')
                    .send({fbId: testUser.id, accessToken: testUser.access_token})
                    .set('Accept', 'application/json'), 'end');

            var newUser = response.body;

            expect(newUser).not.toBe(null);
            expect(newUser.email).toBe(testUser.email);

            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done();
        });
    });

    it('it should be able to register google account', function(done){
        Q.async(function*(){
            var url = 'https://accounts.google.com/o/oauth2/token';
            var response = yield Q.ninvoke(
                superagent.post(url)
                    .send({
                        client_id: Config.Google.clientId,
                        client_secret: Config.Google.clientSecret,
                        refresh_token: Config.Google.testUser.refreshToken,
                        grant_type: 'refresh_token'
                    })
                    .set('Content-Type', 'application/x-www-form-urlencoded') //must set content-type, other wise won't work
                    .set('Accept', 'application/json'), 'end');

            var accessToken = response.body && response.body.access_token;

            //using test user access token to register google account
            var registerResponse = yield Q.ninvoke(
                superagent.post(Config.HOSTURL + 'api/users/googleRegister')
                    .send({email: Config.Google.testUser.email, name: Config.Google.testUser.name,
                        googleId: Config.Google.testUser.userId, accessToken: accessToken})
                    .set('Accept', 'application/json'), 'end');

            //then login using the access token
            response = yield Q.ninvoke(
                superagent.post(Config.HOSTURL + 'api/users/googleLogin')
                    .send({googleId: Config.Google.testUser.userId, accessToken: accessToken})
                    .set('Accept', 'application/json'), 'end');

            var newUser = response.body;

            expect(newUser).not.toBe(null);
            expect(newUser.email).toBe(Config.Google.testUser.email);

            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done();
        });
    });

    it('it should able to login, set cookie session', function(done){
        Q.async(function*(){
            yield Q.ninvoke(
                superagent.post(Config.HOSTURL + 'api/users/register')
                    .send(user)
                    .set('Accept', 'application/json'), 'end');

            var response = yield Q.ninvoke(
                superagent.post(Config.HOSTURL + 'api/users/signin')
                    .send(user)
                    .set('Accept', 'application/json'), 'end');

            var newUser = response.body;
            //cookie is set
            expect(response.header['set-cookie']).not.toBe(null);
            expect(response.header['set-cookie'][0]).not.toBe(null);

            var cookieParsed = cookie.parse(response.header['set-cookie'][0]);
            var sessionId = cookieParser.signedCookie(cookieParsed['sid'], Config.Global.sessionSecret);

            expect(newUser).not.toBe(null);
            expect(newUser.email).toBe(user.email);
            expect(newUser.name).toBe(user.name);

            var session = yield Q.denodeify(redis.get)("sess:" + sessionId);

            var sUser = JSON.parse(session).user;
            expect(sUser).not.toBe(null);
            expect(sUser.email).toBe(user.email);

            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done();
        });
    });

    describe('authenticated api test suite', function(){
        beforeEach(function(done){
            Q.async(function*(){
                yield Q.ninvoke(
                    superagent.post(Config.HOSTURL + 'api/users/register')
                        .send(user)
                        .set('Accept', 'application/json'), 'end');

                var response = yield Q.ninvoke(
                    superagent.post(Config.HOSTURL + 'api/users/signin')
                        .send(user)
                        .set('Accept', 'application/json'), 'end');

                agent.saveCookies(response);
                done();
            })()
            .fail(function(error){
                expect(error).toBe(null);
                done();
            });
        });

        afterEach(function(done){
            Q.all([
                    redis.flushdb(),
                    Q(sequelize.client.query("DELETE FROM User"))
                ])
                .then(function(){
                    done();
                })
                .fail(function(error){
                    winston.error(error.stack || error);
                    done(false);
                });
        });

        it('it should change the user password', function(done){
            Q.async(function*(){
                //change password
                var response = yield Q.ninvoke(
                    superagent.post(Config.HOSTURL + 'api/users/changePassword')
                    .send({
                        email: user.email,
                        password: user.password,
                        newPassword: crypto.createHash('md5').update('111112').digest('hex')
                    })
                    .set('Accept', 'application/json'), 'end')

                //then login using new password
                response = yield Q.ninvoke(
                    superagent.post(Config.HOSTURL + 'api/users/signin')
                        .send({email: user.email, password: crypto.createHash('md5').update('111112').digest('hex')})
                        .set('Accept', 'application/json'), 'end');

                var newUser = response.body;

                expect(newUser).not.toBe(null);
                expect(newUser.email).toBe(user.email);
                expect(newUser.name).toBe(user.name);

                done();
            })()
            .fail(function(error){
                expect(error).toBe(null);
                done();
            });
        });

        it('it should return user session info', function(done){
            Q.async(function*(){
                var request = superagent.post(Config.HOSTURL + 'api/users/userInfo');
                agent.attachCookies(request);

                //get user info
                var response = yield Q.ninvoke(request
                            .send(user)
                            .set('Accept', 'application/json'), 'end')

                var sUser = response.body;
                expect(sUser).not.toBe(null);
                expect(sUser.email).toBe(user.email);

                done();
            })()
            .fail(function(error){
                expect(error).toBe(null);
                done();
            });
        });
    });
});