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

var dbmock              = require('../../mocks/databasemocks');
var mongoose            = require('../../database/mongoose.js');
var sequelize           = require("../../database/sequelize.js");
var redis               = require("../../database/redis.js");
var mongo               = require("../../database/mongo.js");
var modules             = require("../../modules/index.js");

describe('generator specs', function(){
    it('promise with argument', function(done){
        var promiseA = Q.async(function*(a, b){
            return [yield Q.delay(a, 20), yield Q.delay(b, 40)];
        });

        promiseA(5, 6)
            .then(function(results){
                expect(results.length).toBe(2);
                expect(results[0]).toBe(5);
                expect(results[1]).toBe(6);
                done();
            })
            .fail(function(error){
                winston.error(error.stack || error);
                done();
            });
    });
});

