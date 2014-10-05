'use strict';

(function(module) {
    var Q                   = require("q");
    var async               = require("async");
    var path                = require("path");
    var crypto				= require('crypto');
    var fs					= require("fs");
    var fse					= require("fs-extra");

    var beaver              = require("../../Beaver.js");
    var Busboy              = require('busboy');
    var inspect             = require('util').inspect;

    //some middleware for specific route
    module._middlewares = {
        'uploadAvatar': ['hashFileUpload']
    }

    //upload user avatar
    module.uploadAvatar = function(req, res)
    {
        Q.async(
            function*(){
                if(req.files && req.files[0])
                {
                    var uploadedFile = req.files[0];

                    //move image to content/avatar/ folter and change to hash filed name
                    yield Q.denodeify(fse.copy)(
                            path.join(beaver.config.global.uploadsFolder, uploadedFile.name),
                            path.join(ROOTDIR+"/content/avatar/"+ uploadedFile.hashFileName)
                        );

                    var maxWidth, maxHeight;
                    maxWidth = maxHeight = 96;

                    var outPath = ROOTDIR+"/content/avatar/"+ uploadedFile.hashFileName;

                    //resize image
                    yield beaver.utils.spawnProcess("convert", [outPath, "-resize", maxWidth+"x"+maxHeight+"\>", outPath]);

                    //then update avatar attribute in database
                    yield Q(beaver.sequelizeModels.User.update({
                        avatar: beaver.config.global.resourcePrefix + "content/avatar/" + uploadedFile.hashFileName
                    }, {id: req.session.user.id}));

                    res.success(uploadedFile);
                }
                else
                {
                    res.error("No file has been uploaded");
                }
            })()
            .fail(function(error){
                res.error(error);
            });
    }
}(exports));