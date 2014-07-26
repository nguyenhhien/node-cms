var Config              = require("../config.js").test;

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

var dbmock              = require('../mocks/databasemocks');
var mongoose            = require('../database/mongoose.js');
var sequelize           = require("../database/sequelize.js");
var redis               = require("../database/redis.js");
var mongo               = require("../database/mongo.js");
var modules             = require("../modules/index.js");

describe('chat conversation module specs', function(){
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

    it('it should register new account', function(done){
        Q.ninvoke(
            superagent.post(Config.HOSTURL + 'api/users/register')
                .send(user)
                .set('Accept', 'application/json'), 'end')
            .then(function(response){
                //should have account activation field
                expect(response.emailActivation).not.toBe(null);
                return sequelize.models.User.find({where: {email: user.email}});
            })
            .then(function(newUser){
                expect(newUser).not.toBe(null);
                expect(newUser.email).toEqual(user.email);
            })
            .then(function(){
                done();
            })
            .fail(function(error){
                winston.error(error.stack || error);
                done();
            })
    });

    it('it should able to login, set cookie session', function(done){
        Q.ninvoke(
            superagent.post(Config.HOSTURL + 'api/users/register')
                .send(user)
                .set('Accept', 'application/json'), 'end')
            .then(function(){
                return Q.ninvoke(
                    superagent.post(Config.HOSTURL + 'api/users/signin')
                        .send(user)
                        .set('Accept', 'application/json'), 'end');
            })
            .then(function(response){
                var newUser = response.body;
                //cookie is set
                expect(response.header['set-cookie']).not.toBe(null);
                expect(response.header['set-cookie'][0]).not.toBe(null);

                var cookieParsed = cookie.parse(response.header['set-cookie'][0]);
                var sessionId = cookieParser.signedCookie(cookieParsed['sid'], Config.Global.sessionSecret);

                expect(newUser).not.toBe(null);
                expect(newUser.email).toBe(user.email);
                expect(newUser.name).toBe(user.name);

                //session should exist in database
                return Q.denodeify(redis.get)("sess:" + sessionId);
            })
            .then(function(session){
                var sUser = JSON.parse(session).user;
                expect(sUser).not.toBe(null);
                expect(sUser.email).toBe(user.email);
            })
            .then(function(){
                done();
            })
            .fail(function(error){
                winston.error(error.stack || error);
                done();
            });
    });

    describe('authenticated api test suite', function(){
        beforeEach(function(done){
            Q.ninvoke(
                    superagent.post(Config.HOSTURL + 'api/users/register')
                        .send(user)
                        .set('Accept', 'application/json'), 'end')
                .then(function(){
                    return Q.ninvoke(
                        superagent.post(Config.HOSTURL + 'api/users/signin')
                            .send(user)
                            .set('Accept', 'application/json'), 'end');
                })
                .then(function(response){
                    agent.saveCookies(response);
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

        it('it should return user session info', function(done){
            var request = superagent.post(Config.HOSTURL + 'api/users/userInfo');
            agent.attachCookies(request);

            //get user info
            return Q.ninvoke(
                request
                    .send(user)
                    .set('Accept', 'application/json'), 'end')
                .then(function(response){
                    var sUser = response.body;
                    expect(sUser).not.toBe(null);
                    expect(sUser.email).toBe(user.email);
                    done();
                })
        });
    });

});