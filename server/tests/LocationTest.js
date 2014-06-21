require("./config-test.js");
require("../constant.js");

var models              = require("../models");
var Database            = require("../database");
var Q                   = require("q");
var _                   = require('lodash-node');
var path                = require("path");
var fs					= require("fs");
var http				= require("http");
var log4js              = require('log4js');

var sequelize = models.sequelize;

log4js.configure({
    "appenders": [
        {
            type: "console"
        }
    ],
    replaceConsole: true
});

logger = log4js.getLogger("main");
logger.setLevel("INFO");

exports["setUp"] = function(callback)
{
    //synchronize the database schema
    Database.syncSchema(function(err){
        callback && callback(err);
    });
}

exports["tearDown"] = function(callback)
{
    Database.close();
    callback && callback();
}


exports['Test Sequelize Create/Update/Delete'] = {
    setUp: function(callback)
    {
        callback();
    },
    testAddNode: function(test)
    {
        return test.done();
        var insertArr = ["TELEVISION", "TUBE", "LCD", "PLASMA", "PORTABLE ELECTRONIC", "MP3 PLAYER", "FLASH", "CD PLAYER", "2 WAY RADIOS"];
        var chainPromise = Q(1);

        insertArr.forEach(function(elem){
            chainPromise = chainPromise.then(function(parentId){
                return models.Location.addTreeNode(parentId, {name: elem})
                    .then(function(newNode){
                        console.log("newNode Id", newNode && newNode.id);
                        return Q(newNode.id);
                    });
            })
        })

        chainPromise
            .then(function(data){
                console.log("newly added node", data);
                test.done();
            })
            .fail(function(err){
                test.ok(false, err);
                test.done();
            })
    },
    testGetFullTree: function(test)
    {
        Q(models.Location.getFullTree())
            .then(function(data){
                console.log(data);
                test.done();
            })
            .fail(function(err){
                test.ok(false, err);
                test.done();
            })
    }
};