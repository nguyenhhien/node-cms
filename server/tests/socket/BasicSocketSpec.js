require("../../constant.js");

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

var beaver              = require('../../../Beaver.js');

describe('chat conversation module specs', function(){
    var options ={
        transports: ['websocket'],
        'force new connection': true
    };

    var users = [
        {
            email: 'abraham_lincoln@gmail.com',
            name: 'Abraham Lincoln',
            password: crypto.createHash('md5').update('111111').digest('hex'),
            rawPassword: '111111'
        },
        {
            email: 'james_cameroon@gmail.com',
            name: 'James Cameroon',
            password: crypto.createHash('md5').update('111111').digest('hex'),
            rawPassword: '111111'
        },
        {
            email: 'david_backham@gmail.com',
            name: 'David Backham',
            password: crypto.createHash('md5').update('111111').digest('hex'),
            rawPassword: '111111'
        }
    ];

    var loginReturnSession = Q.async(function*(user){
        yield Q.ninvoke(
            superagent.post(beaver.config.global.origin + 'api/user/register')
                .send(user)
                .set('Accept', 'application/json'), 'end');

        var response = yield Q.ninvoke(
            superagent.post(beaver.config.global.origin + 'api/user/signin')
                .send(user)
                .set('Accept', 'application/json'), 'end');

        users.forEach(function(elem){
            if(elem.email == response.body.email)
            {
                elem.id = response.body.id;
            }
        });

        var sessionCookie = response.header['set-cookie'][0];

        return Q.resolve(sessionCookie);
    });

    var sessionCookies, sessionIds;

    //init beaver
    function beaverInit()
    {
        var deferred = Q.defer();

        beaver.mock(function(error, data){
            if(error)
            {
                deferred.reject(error.stack || error);
            }
            else
            {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }

    beforeEach(function(done){
        Q.async(function*(){
            yield beaverInit();

            sessionCookies = [yield loginReturnSession(users[0]), yield loginReturnSession(users[1]), yield loginReturnSession(users[2])];

            sessionIds = sessionCookies.map(function(elem){
                return cookieParser.signedCookie(cookie.parse(elem)['sid'], beaver.config.global.sessionSecret);
            });

            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done();
        });
    });

    afterEach(function(done){
        Q.all([
                beaver.redis.flushdb(),
                Q(beaver.sequelize.client.query("DELETE FROM User"))
            ])
            .then(function(){
                beaver.redis.close();
                beaver.sequelize.close();
                beaver.mongoose.close();
                beaver.mongo.close();
                done();
            })
            .fail(function(error){
                expect(error).toBe(null);
                done(false);
            });
    });

    function socketLogin(userIdx)
    {
        var deferred = Q.defer();

        var client = io.connect(beaver.config.global.origin + "?cookie=" + encodeURIComponent(sessionCookies[userIdx]), {
            transports: ['websocket', 'xhr-polling', 'jsonp-polling', 'flashsocket'],
            'force new connection': true
        });

        client.on('event:connect',function(data){
            deferred.resolve(client);
        });


        return deferred.promise;
    }

    it('it should register user and login', function(done){
        Q.async(function*(){
            var count = yield beaver.sequelize.models.User.count();
            expect(count).toBe(3);
            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done(false);
        })
    });

    it('one user should be able to connect', function(done){
        Q.async(function*(){
            var client = yield socketLogin(0);

            var onlineUserKeys = yield Q.ninvoke(beaver.redis.client, 'keys', 'user:*');
            expect(onlineUserKeys.length).toBe(1);

            var onUser = yield Q.denodeify(beaver.redis.getObject)(onlineUserKeys[0]);
            expect(onUser.email).toBe(users[0].email);

            client.disconnect();
            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done(false);
        })
    });


    it('it should open multiple socket connections', function(done){
        Q.async(function*(){
            var socketClients = yield Q.all([socketLogin(0), socketLogin(1), socketLogin(2)]);

            //check if redis is set properly
            var allUserOnlineIds = yield Q.denodeify(beaver.redis.getSortedSetRange)("users:online", 0, -1);
            expect(allUserOnlineIds.length).toBe(3);

            var differences = _.difference(
                allUserOnlineIds.map(function(elem){return parseInt(elem);}),
                users.map(function(elem){return parseInt(elem.id);})
            );

            expect(differences.length).toBe(0);
            socketClients.forEach(function(socketClient){
                socketClient.disconnect();
            });

            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done();
        });
    });

    it('it should receive user online event', function(done){
        var client1;

        var client = io.connect(beaver.config.global.origin + "?cookie=" + encodeURIComponent(sessionCookies[0]), {
            transports: ['websocket', 'xhr-polling', 'jsonp-polling', 'flashsocket'],
            'force new connection': true
        });

        client.on('event:connect',function(data){
            client1 = io.connect(beaver.config.global.origin + "?cookie=" + encodeURIComponent(sessionCookies[1]), {
                transports: ['websocket', 'xhr-polling', 'jsonp-polling', 'flashsocket'],
                'force new connection': true
            });
        });

        client.on('user.isOnline', function(err, data){
            expect(parseInt(data.id)).toBe(parseInt(users[1].id));
            client.disconnect();
            client1 && client1.disconnect();
            done();
        });
    });
});