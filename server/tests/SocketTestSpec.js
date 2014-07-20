var Q                   = require("q");
var _                   = require('lodash-node');
var winston             = require('winston');
var async               = require('async');
var io                  = require('socket.io-client');

var dbmock              = require('../mocks/databasemocks');
var mongoose            = require('../database/mongoose.js');
var sequelize           = require("../database/sequelize.js");
var redis               = require("../database/redis.js");
var mongo               = require("../database/mongo.js");
var modules             = require("../modules/index.js");

describe('chat conversation module specs', function(){
//    var socketURL = 'http://auth.epouch.com:8888';
    var socketURL = 'http://127.0.0.1:8888';

    var options ={
        transports: ['websocket'],
        'force new connection': true
    };

    beforeEach(function(done){
        done();
    });

    afterEach(function(done){
        done();
    });

    it('it should open socket connection', function(done){
        var client = io.connect(socketURL);

        client.on('connect',function(data){
            winston.info("connected");
            done();
        });
    });
});