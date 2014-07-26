var Q                   = require("q");
var _                   = require('lodash-node');
var winston             = require('winston');
var async               = require('async');
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
    var options ={
        transports: ['websocket'],
        'force new connection': true
    };

    var user = {
        email: 'abraham_lincoln@gmail.com',
        name: 'Abraham Lincoln',
        password: crypto.createHash('md5').update('111111').digest('hex'),
        rawPassword: '111111'
    };

    beforeEach(function(done){
        Q.all([redis.init(), sequelize.init()])
            .then(function(){
                return Q.ninvoke(
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
                        var cookieParsed = cookie.parse(response.header['set-cookie'][0]);
                        var sessionId = cookieParser.signedCookie(cookieParsed['sid'], Config.Global.sessionSecret);
                    })
            })
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

    it('it should open socket connection', function(done){
        var client = io.connect(Config.HOSTURL + "?cookie=bar", {
            transports: ['websocket', 'xhr-polling', 'jsonp-polling', 'flashsocket']
        });

        client.on('connect',function(data){
            winston.info("connected");
            done();
        });
    });
});