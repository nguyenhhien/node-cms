var express             = require('express');
var bcrypt 		        = require("bcrypt");
var models              = require("../models");
var mongooseModel       = require('../mongoose');
var Q                   = require("q");
var async               = require("async");
var utils               = require("../helpers/Utils.js");
var Email               = require("../modules/email");
var request 	        = require("request");
var _                   = require('lodash-node');
var Chance              = require('chance'),
    chance              = new Chance();
var                     dateFormat = require('dateformat');
var Utils               = require("../helpers/Utils.js");

var router = express.Router();

//create new or update
router.post("/locations", function(req, res){

});


//get list of location
router.get("/locations", function(req, res){

});

//get location with id
router.get("/locations/:id", function(req, res){

});


//update location -- using post because it's not idempotent
router.post("/locations/:id", function(req, res){

});

//remove location
router.delete("/locations/:id", function(req, res){

});