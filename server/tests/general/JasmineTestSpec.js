var Q                   = require("q");
var _                   = require('lodash-node');

describe('jasmine-node-flat', function(){
    it('should pass', function(){
        expect(1+2).toEqual(3);
    });
});

describe('jasmine-async-test', function(){
    it("should pass", function(done){
        function asyncFunc(number, callback)
        {
            setTimeout(function(){
                return callback && callback(null, number);
            }, 10);
        }

        asyncFunc(4, function(err, data){
            expect(data).toEqual(4);
            done();
        })
    })
})

describe('async series promise', function(){
    function isValidArray(results)
    {
        var valid = true;
        if(!results || !results.length) return false;

        for(var i=0; i<results.length; ++i)
        {
            if(results[i] != i)
            {
                valid = false;
            }
        }

        return valid;
    }

    function QdelayPush(ms, value, results)
    {
        var deferred = Q.defer();

        setTimeout(function(){
            results.push(value);
            deferred.resolve(value)
        }, ms);

        return deferred.promise;
    }

    function random(max)
    {
        return Math.round(max * Math.random());
    }

    it('correct async series', function(done){
        var results = [];
        var finalPromise = QdelayPush(random(10), 0, results);

        for(var i=1; i<100; ++i)
        {
            (function(i){
                finalPromise = finalPromise.then(function(value){
                    return QdelayPush(random(10), i, results);
                })
            }(i));
        }

        finalPromise
            .then(function(){
                var valid = isValidArray(results);
                expect(valid).toBe(true);
                done();
            })
            .fail(function(err){
                console.log("ERROR", err);
                expect(err).toBe(null);
                done();
            })
    });

    it('correct async series array reduce', function(done){
        var results = [];
        var tasks = [];

        for(var i=1; i<100; ++i)
        {
            (function(i){
                //NOTE: we push function into array
                tasks.push(function(){
                    return QdelayPush(random(i), i, results);
                })
            }(i));
        }

        tasks.reduce(function(prevTaskPromise, task) {
                return prevTaskPromise.then(task);
            }, QdelayPush(random(10), 0, results))
            .then(function(){
                var valid = isValidArray(results);
                expect(valid).toBe(true);
                done();
            })
            .fail(function(err){
                console.log("ERROR", err);
                expect(err).toBe(null);
            });
    });

    it('incorrect async series implementation', function(done){
        var results = [];
        var tasks = [];

        //push all promise into tasks array
        for(var i=1; i<100; ++i)
        {
            (function(i){
                //NOTE: we push directly promise into tasks --> EVIL
                tasks.push(QdelayPush(random(i), i, results));
            }(i));
        }

        tasks.reduce(function(prevTaskPromise, task) {
            return prevTaskPromise.then(function(value){
                //return next promise as usual
                return task;
            });
        }, QdelayPush(random(10), 0, results))
            .then(function(){
                var valid = isValidArray(results);
                expect(valid).toBe(false);
                done();
            })
            .fail(function(err){
                console.log("ERROR", err);
                expect(err).toBe(null);
            });
    });
})
