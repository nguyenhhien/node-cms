//NOTE: Need to close connection off all socket clients after each test case completely
//otherwise, some test case will fail

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
var signature           = require('cookie-signature');
var uid                 = require('uid-safe').sync;

var beaver              = require('../../../Beaver.js');

describe('socket io fake session fast test suite', function(){
    var users = [
        {
            id: 11,
            email: 'abraham_lincoln@gmail.com',
            name: 'Abraham Lincoln',
            password: crypto.createHash('md5').update('111111').digest('hex'),
            rawPassword: '111111'
        },
        {
            id: 12,
            email: 'james_cameroon@gmail.com',
            name: 'James Cameroon',
            password: crypto.createHash('md5').update('111111').digest('hex'),
            rawPassword: '111111'
        },
        {
            id: 13,
            email: 'david_backham@gmail.com',
            name: 'David Backham',
            password: crypto.createHash('md5').update('111111').digest('hex'),
            rawPassword: '111111'
        }
    ];

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
            //auto create fake session inside the database for socket login
            yield beaverInit();
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

    function mockSession(user)
    {
        var deferred = Q.defer();

        var mockSessionId = uid(24);
        var signedSession = signature.sign(mockSessionId, beaver.config.global.sessionSecret);
        var serializedCookie = cookie.serialize('sid', 's:'+signedSession);

        //set session info
        Q.denodeify(beaver.redis.set)('sess:' + mockSessionId, JSON.stringify({user: user}))
            .then(function(){
                return deferred.resolve(serializedCookie);
            })
            .fail(function(error){
                return deferred.reject(error.stack || error);
            });

        return deferred.promise;
    }

    function socketLogin(userIdx)
    {
        var deferred = Q.defer();

        mockSession(users[userIdx])
            .then(function(serializedCookie){
                var client = io.connect(beaver.config.global.origin + "?cookie=" + encodeURIComponent(serializedCookie), {
                    transports: ['websocket', 'xhr-polling', 'jsonp-polling', 'flashsocket'],
                    'force new connection': true
                });

                client.on('event:connect',function(data){
                    deferred.resolve(client);
                });
            })
            .fail(function(error){
                return deferred.reject(error.stack || error);
            });

        return deferred.promise;
    }

    it('sign and unsign cookies', function(done){
        Q.async(function*(){
            var serializedCookie = yield mockSession(users[0]);

            var parsedCookie = cookie.parse(serializedCookie);
            expect(parsedCookie.sid).not.toBe(null);

            var sessionId = cookieParser.signedCookie(parsedCookie['sid'], beaver.config.global.sessionSecret);
            expect(sessionId).not.toEqual(parsedCookie.sid);

            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done();
        });
    });

    it('mock up session socket connect', function(done){
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
        });
    });

    it('mock up session multile socket connect', function(done){
        Q.async(function*(){
            var clients = [yield socketLogin(0), yield socketLogin(1), yield socketLogin(2)];

            var onlineUserKeys = yield Q.ninvoke(beaver.redis.client, 'keys', 'user:*');
            expect(onlineUserKeys.length).toBe(3);

            var onUser = yield Q.denodeify(beaver.redis.getObject)(onlineUserKeys[0]);
            expect(users.map(function(elem){return elem.email;}).indexOf(onUser.email)).not.toBe(-1);

            (clients || []).forEach(function(client){
                client.disconnect();
            });

            done();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done(false);
        });
    });

    it('it should be able to broadcast online user', function(done){
        socketLogin(0)
            .then(function(client0){
                //client0 will receipt broadcast event of client1
                client0.on('user.isOnline', function(err, data){
                    expect(data.id).toEqual(users[1].id);
                    client0.disconnect();
                    done();
                })
            })
            .then(function(){
                return socketLogin(1);
            })
            .then(function(client1){
                client1.disconnect();
            })
            .fail(function(err, data){
                expect(error).toBe(null);
                done(false);
            });
    });

    it('it should broadcast disconnect event', function(done){
        Q.async(function*(){
            var clients = [yield socketLogin(0), yield socketLogin(1)];
            clients[0].on('user.disconnect', function(err, data){
                expect(data.id).toEqual(users[1].id);
                clients[0].disconnect();
                done();
            });
            clients[1].disconnect();
        })()
        .fail(function(error){
            expect(error).toBe(null);
            done(false);
        });
    });

//    it('it should run correct online users', function(done){
//        Q.async(function*(){
//            var clients = [yield socketLogin(0), yield socketLogin(1), yield socketLogin(2)];
//            clients[0].emit('user.loadMore', {set: "users:online", offset: 0, limit: 20}, function(err, data)
//            {
//                expect(data.results.length).toBe(3);
//                expect(_.difference(data.results.map(function(elem){return elem.email;}),
//                    users.map(function(elem){return elem.email})).length
//                ).toBe(0);
//
//                (clients || []).forEach(function(client){
//                    client.disconnect();
//                });
//
//                done();
//            });
//        })()
//        .fail(function(error){
//            expect(error).toBe(null);
//            done(false);
//        });
//    });
});
