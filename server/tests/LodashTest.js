var _                       = require('lodash-node');
var Q                       = require('q');

exports['Test Transform From Array To Object'] = function(test)
{
    var arr = [
        {
            name: "key1",
            values: [1, 2, 3]
        },
        {
            name: "key2",
            values: [2, 8, 10]
        }
    ];

    var results = _.transform(arr, function(results, elem){
        results[elem.name] = elem.values;
    })

    console.log(results);
    test.done();
}

exports['Test Q resolve synchnous'] = function(test)
{
    function promise()
    {
        var deferred = Q.defer();
        deferred.resolve(4);
        return deferred.promise;
    }

    promise()
        .then(function(data){
            test.equal(data, 4);
            test.done();
        })
        .fail(function(err){
            test.ok(false, err);
            test.done();
        })

}
