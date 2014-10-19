'use strict';

//keep configuration in mongo database and allow override value in config folder
//therefore, it only keep replacable/non-sessitive config
(function(module) {
    var Q                   = require("q");
    var async               = require("async");
    var beaver              = require("../../Beaver.js");
    var os                  = require("os");

    //get public config
    module.publicConfig = function(req, res)
    {
        Q.async(
            function* () {
                var configuration = yield beaver.models.mongoose.Configuration
                    .findOne()
                    .select('oath')
                    .lean()
                    .execQ()

                res.success(configuration);
            })()
            .fail(function(error){
                res.error(error.stack || error);
            });
    }

    module.find = function(req, res)
    {
        if(!req.session || !req.session.user)
        {
            return res.error("User session not found");
        }

        //return the first one
        Q.async(
            function* () {
                var configuration = yield beaver.models.mongoose.Configuration
                    .findOne()
                    .lean()
                    .execQ()

                //also return system info
                configuration.systemInfo = {
                    totalMem: os.totalmem() / (1024*1024),
                    availMem: os.freemem() / (1024*1024),
                    cpus: os.cpus(),
                    uptime: os.uptime()/60,
                    os: os.platform() + "," + os.arch(),
                    nodeVersion: process.version
                };

                res.success(configuration);
            })()
            .fail(function(error){
                res.error(error.stack || error);
            });
    }

    module.update = function(req, res)
    {
        if(!req.session || !req.session.user)
        {
            return res.error("User session not found");
        }

        Q.async(
            function* () {
                var configurations = yield beaver.models.mongoose.Configuration
                    .find()
                    .lean()
                    .execQ()

                //update based on body
                if(configurations && configurations.length)
                {
                    yield beaver.models.mongoose.Configuration
                        .update({_id: configurations[0]._id}, req.body)
                        .lean()
                        .execQ();

                    res.success();
                }
                else
                {
                    return Q.reject("Configuration object does not exist in database");
                }
            })()
            .fail(function(error){
                res.error(error.stack || error);
            });
    }
}(exports));