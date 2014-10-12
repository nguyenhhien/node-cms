require("../../constant.js");

var Q                   = require("q");
var _                   = require('lodash-node');
var winston             = require('winston');
var async               = require('async');

var beaver              = require('../../../Beaver.js');

describe('redis db module specs', function(){
    beforeEach(function(done){
        beaver.mock(function(error, data){
            if(error)
            {
                console.log(error.stack || error);
                done(false);
            }
            else
            {
                done();
            }
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
                winston.error(error.stack || error);
                done(false);
            });
    });

    var key = "user:2";
    var user = {
        email: "admin@gmail.com",
        avatar: "https://avatar.com"
    }

    //need explit error handling because node-jasmine can't catch async error
    it('get/set redis hash object denosify', function(done){
        Q.async(function*() {
            yield Q.denodeify(beaver.redis.setObject)(key, user);
            var nUser = yield Q.denodeify(beaver.redis.getObject)(key);
            expect(nUser.email).toEqual(user.email);
            expect(nUser.avatar).toEqual(user.avatar);
            done();
        })()
        .fail(function(error){
            winston.error(error.stack|| error);
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

        Q.async(function*() {
            //get and set
            yield Q.denodeify(beaver.redis.setObject)(key2, user2)
            yield Q.denodeify(beaver.redis.setObject)(key3, user3);
            yield Q.denodeify(beaver.redis.setObjectField)(key2, 'age', 20);

            //get objects
            var users = yield Q.denodeify(beaver.redis.getObjects)([key2, key3]);
            expect(users.length).toBe(2);
            expect(parseInt(users[0].age)).toBe(20);
            expect(parseInt(users[1].age)).toBe(19);

            //get objects field
            var user = yield Q.denodeify(beaver.redis.getObjectFields)(key2, ['email', 'age']);
            expect(Object.keys(user).length).toBe(2);
            expect(Object.keys(user).indexOf('avatar')).toBe(-1);
            expect(parseInt(user.age)).toBe(20);

            //get multiple object fields
            users = yield Q.denodeify(beaver.redis.getObjectsFields)([key2, key3], ['email', 'age']);
            expect(users.length).toBe(2);
            expect(parseInt(users[0].age)).toBe(20);

            //increment object field
            yield Q.denodeify(beaver.redis.incrObjectField)(key2, 'age');
            user = yield Q.denodeify(beaver.redis.getObjectFields)(key2, ['age']);
            expect(parseInt(user.age)).toBe(21);

            //exist key or not
            results = yield Q.all([
                Q.denodeify(beaver.redis.isObjectField)(key2, 'address'),
                Q.denodeify(beaver.redis.isObjectField)(key2, 'age')
            ]);

            expect(results.length).toBe(2);
            expect(results[0]).toBe(false);
            expect(results[1]).toBe(true);

            done();
        })()
        .fail(function(error){
            winston.error(error.stack|| error);
            done();
        });
    });

    it('redis list test', function(done){
        var key = "list:2";

        Q.async(function*(){
            yield Q.denodeify(beaver.redis.listPrepend)(key, 2);
            yield Q.denodeify(beaver.redis.listPrepend)(key, 3);
            yield Q.denodeify(beaver.redis.listAppend)(key, 4);

            var listData = yield Q.denodeify(beaver.redis.getListRange)(key, 0, 2);

            expect(listData.length).toBe(3);
            expect(parseInt(listData[0])).toBe(3);
            expect(parseInt(listData[1])).toBe(2);
            expect(parseInt(listData[2])).toBe(4);

            yield Q.denodeify(beaver.redis.listRemoveLast)(key);
            listData = yield Q.denodeify(beaver.redis.getListRange)(key, 0, 2);

            expect(listData.length).toBe(2);
            expect(parseInt(listData[0])).toBe(3);
            expect(parseInt(listData[1])).toBe(2);

            done();
        })()
        .fail(function(error){
            winston.error(error.stack|| error);
            done();
        });
    });

    it('redis set test', function(done){
        var key = "set:2";

        Q.async(function*(){
            yield Q.denodeify(beaver.redis.setAdd)(key, 2);
            yield Q.denodeify(beaver.redis.setAdd)(key, 3);

            var count = yield Q.denodeify(beaver.redis.setCount)(key);
            expect(count).toBe(2);

            var data = yield Q.denodeify(beaver.redis.getSetMembers)(key);
            expect(data.indexOf('2')).not.toBe(-1);
            expect(data.indexOf('3')).not.toBe(-1);
            expect(data.indexOf('4')).toBe(-1);

            data = yield Q.denodeify(beaver.redis.isSetMembers)(key, [2, 4]);
            expect(data[0]).toBe(true);
            expect(data[1]).toBe(false);

            data = yield Q.denodeify(beaver.redis.isSetMember)(key, 2);
            expect(data).toBe(true);

            yield Q.denodeify(beaver.redis.setRemoveRandom)(key);
            data = yield Q.denodeify(beaver.redis.getSetMembers)(key);
            count = yield Q.denodeify(beaver.redis.setCount)(key);
            expect(count).toBe(1);

            done();
        })()
        .fail(function(error){
            winston.error(error.stack|| error);
            done();
        });
    });

    it('redis sorted set', function(done){
        var key = 'sorted:2';

        var a = [1, 4, 9, 2];
        var s = [7, 3, 2, 10];

        Q.async(function*(){
            yield Q.denodeify(beaver.redis.sortedSetAdd)(key, s[0], a[0]);
            yield Q.denodeify(beaver.redis.sortedSetAdd)(key, s[1], a[1]);
            yield Q.denodeify(beaver.redis.sortedSetAdd)(key, s[2], a[2]);

            var score = yield Q.denodeify(beaver.redis.sortedSetScore)(key, a[0]);
            expect(parseInt(score)).toBe(s[0]);

            var data = yield Q.denodeify(beaver.redis.getSortedSetRange)(key, 0, -1);
            expect(parseInt(data[0])).toBe(a[2]);
            expect(parseInt(data[1])).toBe(a[1]);
            expect(parseInt(data[2])).toBe(a[0]);

            data = yield Q.denodeify(beaver.redis.sortedSetRemove)(key, 1);
            var count = yield Q.denodeify(beaver.redis.sortedSetCard)(key);
            expect(count).toBe(2);

            done();
        })()
        .fail(function(error){
            winston.error(error.stack|| error);
            done();
        });
    });
});