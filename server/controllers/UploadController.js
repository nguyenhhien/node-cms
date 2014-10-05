'use strict';

(function(module) {
    var Q                   = require("q");
    var async               = require("async");
    var beaver              = require("../../Beaver.js");

    module._middlewares = {
        'userInfo': ['hashFileUpload']
    }

    //upload user avatar
    module.uploadAvatar = function(req, res)
    {
        return res.success();
    }
}(exports));