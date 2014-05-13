var _                       = require('lodash-node');
var Q                       = require('q');
var ActiveSuport            = require('activesupport/active-support-node.js');

exports['Test Lodash Transform From Array To Object'] = function(test)
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
exports['Test Lodash Find'] = function(test)
{
    var arr = ["key1", "key2"];
    var found = _.find(arr, function(elem){return elem == 'key1'});
    test.equal(found, 'key1');
    test.done();
}

exports['Test Active Support'] = function(test)
{
    test.equal('team_projects'.classify(), 'TeamProject');
    test.done();
}

