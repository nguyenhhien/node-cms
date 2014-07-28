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

    var sessionCookie, sessionId;

    beforeEach(function(done){
        Q.async(function*(){
            yield Q.all([redis.init(), sequelize.init()]);
            yield Q.ninvoke(
                superagent.post(Config.HOSTURL + 'api/users/register')
                    .send(user)
                    .set('Accept', 'application/json'), 'end');

            var response = yield Q.ninvoke(
                superagent.post(Config.HOSTURL + 'api/users/signin')
                    .send(user)
                    .set('Accept', 'application/json'), 'end');

            agent.saveCookies(response);
            sessionCookie = response.header['set-cookie'][0];
            sessionId = cookieParser.signedCookie(cookie.parse(sessionCookie)['sid'], Config.Global.sessionSecret);

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
                dbmock.closeRedis();
                sequelize.close();
                done();
            })
            .fail(function(error){
                expect(error).toBe(null);
                done(false);
            });
    });

    it('it should open socket connection', function(done){
        var client = io.connect(Config.HOSTURL + "?cookie=" + encodeURIComponent(sessionCookie), {
            transports: ['websocket', 'xhr-polling', 'jsonp-polling', 'flashsocket']
        });

        client.on('connect',function(data){
            winston.info("connected");
            done();
        });
    });
});