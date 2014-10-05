'use strict';

module.exports = function hashFileUpload(req, res, next)
{
    var fs					= require("fs");
    var fse					= require("fs-extra");
    var crypto				= require('crypto');

    if (!req.files || !req.files.files || !req.files.files.length) return next("No files sent");
    var file = req.files.files[0];

    if (!file) return next("No files sent");

    var fileName = file.name.replace(/\.\./g,"");
    var filePath = file.path.replace(/\.\./g,"");

    var extension = "";
    var filename = file.name.split(".");
    extension = "." + filename.pop();
    if( filename.length === 0 ) {
        extension = "";
    }

    var hashedFileName = "";
    var hashedFileContent = "";

    fs.exists(filePath, function(exists)
    {
        if(!exists) return next("File upload failed")

        fse.mkdirs(ROOTDIR + "/" + serverPath, function(err)
        {
            if (err) return next(err);

            var readStream = fs.createReadStream(filePath);
            var hash = crypto.createHash('sha1');
            readStream
                .on('data', function (chunk) {
                    hash.update(chunk);
                })
                .on('end', function () {
                    hashedFileContent = hash.digest('hex');
                    hashedFileName = hashedFileContent + extension;

                    //Check if the hashed file is already inside the destination
                    //If it is not there move the file over, otherwise just push the map into the array
                    fs.exists(serverPath + hashedFileName, function(yes)
                    {
                        if (!yes)
                        {
                            fs.rename(filePath, serverPath + hashedFileName, function(err)
                            {
                                if (err) return callback(err);

                                callback(null,{
                                    name: fileName,
                                    hashedName: hashedFileName
                                });
                            })
                        }
                        else
                        {
                            callback(null,{
                                name: fileName,
                                hashedName: hashedFileName
                            });
                        }
                    })
                });
        })
    });

}
