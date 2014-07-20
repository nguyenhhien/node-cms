var Q                   = require("q");
var _                   = require('lodash-node');
var winston             = require('winston');
var async               = require('async');

var dbmock              = require('../mocks/databasemocks');
var mongoose            = require('../database/mongoose.js');
var sequelize           = require("../database/sequelize.js");
var redis               = require("../database/redis.js");
var mongo               = require("../database/mongo.js");
var modules             = require("../modules/index.js");

describe('chat conversation module specs', function(){
    beforeEach(function(done){
        dbmock.initRedis()
            .then(function(){
                done();
            })
            .fail(function(){
                done(false);
            })
    });

    afterEach(function(done){
        redis.flushdb(function(err, success){
            dbmock.closeRedis();
            done();
        })
    });

    it('get/set redis hash object denosify', function(done){
        var key = "user:2";
        var user = {
            email: "admin@gmail.com",
            avatar: "https://avatar.com"
        }

        Q.denodeify(redis.setObject)(key, user)
            .then(function(data){
                return Q.denodeify(redis.getObject)(key)
            })
            .then(function(nUser){
                expect(nUser.email).toEqual(user.email);
                expect(nUser.avatar).toEqual(user.avatar);
                done();
            })
            .fail(function(err){
                if(err) expect(err).toBe(null);
                done();
            })
    });

    it('redis hash test suite', function(done){
        var key = "user:2";
        var user = {
            email: "admin@gmail.com",
            avatar: "https://avatar.com"
        }

        Q.ninvoke(redis, "setObject", key, user)
            .then(function(data){
                return Q.ninvoke(redis, "getObject", key)
            })
            .then(function(nUser){
                expect(nUser.email).toEqual(user.email);
                expect(nUser.avatar).toEqual(user.avatar);
                done();
            })
            .fail(function(err){
                if(err) expect(err).toBe(null);
                done();
            });
    });

    it("get multiple objects, set object field", function(done){
        var key2 = "user:2";
        var user2 = {
            email: "admin@gmail.com",
            avatar: "https://avatar.com",
            age: 18
        }

        var key3 = "user:3";
        var user3 = {
            email: "admin3@gmail.com",
            avatar: "https://avatar3.com",
            age: 19
        }

        Q.denodeify(redis.setObject)(key2, user2)
            .then(function(data){
                return Q.denodeify(redis.setObject)(key3, user3);
            })
            .then(function(data){
                //set object field
                return Q.denodeify(redis.setObjectField)(key2, 'age', 20);
            })
            .then(function(data){
                return Q.denodeify(redis.getObjects)([key2, key3]);
            })
            .then(function(users){
                expect(users.length).toBe(2);
                expect(parseInt(users[0].age)).toBe(20);
                expect(parseInt(users[1].age)).toBe(19);
            })
            .then(function(users){
                //get objects field
                return Q.denodeify(redis.getObjectFields)(key2, ['email', 'age']);
            })
            .then(function(user){
                expect(Object.keys(user).length).toBe(2);
                expect(Object.keys(user).indexOf('avatar')).toBe(-1);
                expect(parseInt(user.age)).toBe(20);
            })
            .then(function(){
                return Q.denodeify(redis.getObjectsFields)([key2, key3], ['email', 'age']);
            })
            .then(function(users){
                expect(users.length).toBe(2);
                expect(parseInt(users[0].age)).toBe(20);
            })
            .then(function(){
                return Q.all([
                    Q.denodeify(redis.getObjectKeys)(key2),
                    Q.denodeify(redis.getObjectValues)(key2)
                ]);
            })
            .spread(function(keys, values){
                expect(values[0]).toEqual(user2[keys[0]]);
                expect(values[1]).toEqual(user2[keys[1]]);
            })
            .then(function(){
                return Q.all([
                    Q.denodeify(redis.isObjectField)(key2, 'address'),
                    Q.denodeify(redis.isObjectField)(key2, 'age')
                ]);
            })
            .spread(function(notExist, exist){
                expect(exist).toBe(true);
                expect(notExist).toBe(false);
            })
            .then(function(user){
                //increment age
                return Q.denodeify(redis.incrObjectField)(key2, 'age')
                    .then(function(){
                        return Q.denodeify(redis.getObjectFields)(key2, ['age'])
                    })
            })
            .then(function(user){
                expect(parseInt(user.age)).toBe(21);
            })
            .then(function(){
                done();
            })
            .fail(function(err){
                if(err) expect(err).toBe(null);
                done();
            })
    });

    it('redis list test', function(done){
        var key = "list:2";

        //append on top
        Q.denodeify(redis.listPrepend)(key, 2)
            .then(function(){
                return Q.denodeify(redis.listPrepend)(key, 3);
            })
            .then(function(){
                return Q.denodeify(redis.listAppend)(key, 4);
            })
            .then(function(){
                return Q.denodeify(redis.getListRange)(key, 0, 2)
            })
            .then(function(listData){
                expect(listData.length).toBe(3);
                expect(parseInt(listData[0])).toBe(3);
                expect(parseInt(listData[1])).toBe(2);
                expect(parseInt(listData[2])).toBe(4);
            })
            .then(function(){
                return Q.denodeify(redis.listRemoveLast)(key);
            })
            .then(function(){
                return Q.denodeify(redis.getListRange)(key, 0, 2)
            })
            .then(function(listData){
                expect(listData.length).toBe(2);
                expect(parseInt(listData[0])).toBe(3);
                expect(parseInt(listData[1])).toBe(2);
            })
            .then(function(){
                done();
            })
            .fail(function(err){
                if(err) expect(err).toBe(null);
                done();
            });
    });

    it('redis set test', function(done){
        var key = "set:2";

        Q.denodeify(redis.setAdd)(key, 2)
            .then(function(){
                return Q.denodeify(redis.setAdd)(key, 3);
            })
            .then(function(){
                return Q.denodeify(redis.setCount)(key)
                    .then(function(count){
                        expect(count).toBe(2);
                    })
            })
            .then(function(){
                return Q.denodeify(redis.getSetMembers)(key)
                    .then(function(data){
                        expect(data.indexOf('2')).not.toBe(-1);
                        expect(data.indexOf('3')).not.toBe(-1);
                        expect(data.indexOf('4')).toBe(-1);
                    });
            })
            .then(function(data){
                return Q.denodeify(redis.isSetMembers)(key, [2, 4])
                    .then(function(data){
                        expect(data[0]).toBe(true);
                        expect(data[1]).toBe(false);
                    })
            })
            .then(function(data){
                return Q.denodeify(redis.isSetMember)(key, 2)
                    .then(function(data){
                        expect(data).toBe(true);
                    })
            })
            .then(function(data){
                return Q.denodeify(redis.setRemoveRandom)(key)
                    .then(function(data){
                        return Q.denodeify(redis.getSetMembers)(key)
                    })
                    .then(function(data){
                        return Q.denodeify(redis.setCount)(key)
                    })
                    .then(function(count){
                        expect(count).toBe(1);
                    })
            })
            .then(function(){
                done();
            })
            .fail(function(err){
                if(err) expect(err).toBe(null);
                done();
            });
    });

    it('redis sorted set', function(done){
        var key = 'sorted:2';

        var a = [1, 4, 9, 2];
        var s = [7, 3, 2, 10];

        Q.denodeify(redis.sortedSetAdd)(key, s[0], a[0])
            .then(function(){
                return Q.denodeify(redis.sortedSetAdd)(key, s[1], a[1])
                    .then(function(){
                        return Q.denodeify(redis.sortedSetAdd)(key, s[2], a[2]);
                    });
            })
            .then(function(){
                return Q.denodeify(redis.sortedSetScore)(key, a[0])
                    .then(function(score){
                        expect(parseInt(score)).toBe(s[0]);
                    });
            })
            .then(function(){
                return Q.denodeify(redis.getSortedSetRange)(key, 0, -1)
                    .then(function(data){
                        expect(parseInt(data[0])).toBe(a[2]);
                        expect(parseInt(data[1])).toBe(a[1]);
                        expect(parseInt(data[2])).toBe(a[0]);
                    });
            })
            .then(function(){
                return Q.denodeify(redis.sortedSetRemove)(key, 1)
                    .then(function(data){
                        return Q.denodeify(redis.sortedSetCard)(key);
                    })
                    .then(function(count){
                        expect(count).toBe(2);
                    })
            })
            .then(function(){
                done();
            })
            .fail(function(err){
                console.log("Err", err);
                if(err) expect(err).toBe(null);
                done();
            })
    })

});