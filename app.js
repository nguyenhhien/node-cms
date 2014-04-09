require("./server/config.js");

var model               = require("./server/models");
var express 			= require("express");
var fs					= require("fs");
var fse					= require("fs-extra");
var async				= require("async");
var util				= require("util");
var Q                   = require("q");

var sequelize = model.sequelize;
var queryInterface = sequelize.getQueryInterface();

//Q(queryInterface.showAllTables())
//    .then(function(allTables){
//        allTables.forEach(function(table){
//            queryInterface.describeTable(table)
//                .then(function(data){
//                    console.log(data);
//                })
//        })
//    })
//    .fail(function(err){
//        if(err) return console.log(err);
//    })

//queryInterface.showAllSchemas()
//    .then(function(schemas){
//        console.log(schemas);
//    })


//try
//{
//    sequelQueryInterface.showAllTables()
//        .then(function(tables){
//            console.log(tables);
//            return sequelQueryInterface.describeTable("Account");
//        })
//        .then(function(accountAttributes){
//            console.log(accountAttributes);
//        })
//}
//catch(e)
//{
//    console.log("exception", e);
//}


sequelize.sync({force: true}).on('success', function() {
   console.log("done");
});

