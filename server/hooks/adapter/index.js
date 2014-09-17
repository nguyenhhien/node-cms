'use strict';

var Q                   = require("q");

(function(module) {
    module.init = function(beaver, callback) {
        //assign to beaver global object
        beaver.sequelize = require("./sequelize.js");
        beaver.mongoose = require("./mongoose.js");
        beaver.mongo     = require("./mongo.js");
        beaver.redis     = require("./redis.js");

        //init each and every modules
        Q.all([beaver.sequelize.init(beaver), beaver.mongoose.init(beaver), beaver.mongo.init(beaver), beaver.redis.init(beaver)])
            .then(function(){
                callback && callback();
            })
            .fail(function(err){
                callback && callback(err);
            });
    };
}(exports));