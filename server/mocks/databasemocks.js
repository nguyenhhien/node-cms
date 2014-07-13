/**
 * Database Mock - wrapper for database layer, makes system use separate test db, instead of production
 * Mock Database by using different config files
 * ATTENTION: testing db is flushed before every use!
 */

'use strict';

(function(module) {
    require("./config.js");

    var winston             = require('winston');
    var Q                   = require("q");

    var sequelize           = require("../database/sequelize.js");
    var redis               = require("../database/redis.js");
    var mongo               = require("../database/mongo.js");
    var mongoose            = require('../database/mongoose.js');

    //TODO: Other setups if any
    module.init = function()
    {
        return Q.all([mongoose.init()]);
    }

    module.close = function()
    {
        return mongoose.close();
    }
}(exports));