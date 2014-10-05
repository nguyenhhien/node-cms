'use strict';

var Q                   = require("q");
var async               = require("async");
var path                = require("path");
var crypto				= require('crypto');
var fs					= require("fs");
var fse					= require("fs-extra");

var beaver              = require("../../Beaver.js");
var Busboy              = require('busboy');
var inspect             = require('util').inspect;

//parse multi-part body and hash to create hash filename
module.exports = function hashFileUpload(req, res, next)
{
    var busboy = new Busboy({ headers: req.headers });
    var hash = crypto.createHash('sha1');

    var hashedFileName = "";
    var hashedFileContent = "";

    //TODO: need to add userId into hash also
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        var saveTo = path.join(beaver.config.global.uploadsFolder, filename);
        file.pipe(fs.createWriteStream(saveTo));

        file.on('data', function(data) {
            hash.update(data);
        });

        file.on('end', function() {
            //create sha1 hash of file content
            hashedFileContent = hash.digest('hex');
            hashedFileName = hashedFileContent + path.extname(filename);

            //push to list of files in request
            req.files = req.files || [];
            req.files.push({
                name: filename,
                encoding: encoding,
                mimetype: mimetype,
                hashFileName: hashedFileName
            });
        });
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        req.params[fieldname] = inspect(val);
    });

    busboy.on('finish', function() {
        next();
    });

    req.pipe(busboy);
}
