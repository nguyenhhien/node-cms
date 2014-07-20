/**
 * Database Mock - wrapper for database layer, makes system use separate test db, instead of production
 * Mock Database by using different config files
 * ATTENTION: testing db is flushed before every use!
 * run: jasmine-node --color --autotest server/tests
 */

'use strict';

(function(module) {
    require("./config.js");
    require("../constant.js");

    var winston             = require('winston');
    var Q                   = require("q");

    var sequelize           = require("../database/sequelize.js");
    var redis               = require("../database/redis.js");
    var mongo               = require("../database/mongo.js");
    var mongoose            = require('../database/mongoose.js');

    //TODO: Other setups if any
    module.init = function()
    {
        return Q.all([redis.init(), mongo.init(), mongoose.init(), sequelize.init()]);
    }

    module.initMongoose = function()
    {
        return Q.all([mongoose.init()]);
    }

    module.initSequelize = function()
    {
        return Q.all([sequelize.init()]);
    }

    module.initRedis = function()
    {
        return Q.all([redis.init()]);
    }

    module.initMongo = function()
    {
        return Q.all([mongo.init()]);
    }

    //individual close function
    module.closeMongoose = function()
    {
        return mongoose.close();
    }

    module.closeSequelize = function()
    {
        return sequelize.close();
    }

    module.closeRedis = function()
    {
        return redis.close();
    }

    module.closeMongo = function()
    {
        return mongo.close();
    }

    module.close = function()
    {
        mongoose.close();
        mongo.close();
        redis.close();
        sequelize.close();
    }
}(exports));