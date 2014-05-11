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
        var that = this;

        that.modelName = 'Account';
        that.daoFactory = sequelize.daoFactoryManager.getDAO(that.modelName, { attribute: 'tableName' });

        //create dummy account
        var insertedAccount = {
            email: "hiepkhach7488@gmail.com",
            name: "Nguyen Xuan Tuong",
            password: "111111"
        }

        Q(that.daoFactory.create(insertedAccount))
            .then(function(account){
                callback();
            })
            .fail(function(err){
                callback(err);
            })
    },
    tearDown: function(callback)
    {
        var that = this;
        Q(that.daoFactory.destroy())
            .then(function(){
                callback();
            })
            .then(function(err){
                callback(err);
            })
    },
    getAccount: function(test)
    {
        var that = this;
        Q(that.daoFactory.find({ where: {email: 'hiepkhach7488@gmail.com'}, attributes: ['id', 'email', 'name']}))
            .then(function(account){
                test.ok(!!account, "at least one account must be found");
                test.equal(account.name, "Nguyen Xuan Tuong");
                test.done();
            })
            .fail(function(err){
                test.ok(false, err);
            })
    },
    getAllAccounts: function(test)
    {
        var that = this;
        Q(that.daoFactory.findAll({attributes: ['id', 'email', 'name']}))
            .then(function(accounts){
                test.equal(accounts.length, 1);
                test.done();
            })
            .fail(function(err){
                test.ok(false, err);
            })
    },
    bulkCreate: function(test)
    {
        var that = this;
        var insertedList = [
            {
                email:"test502@gmail.com",
                name: "test502"
            },
            {
                email: "test501@gmail.com",
                name: "test501"
            }
        ];

        Q(that.daoFactory.bulkCreate(insertedList))
            .then(function(){
                return Q(that.daoFactory.findAll());
            })
            .then(function(accounts){
                test.equal(accounts.length, 3);
                test.done();
            })
            .fail(function(err){
                test.ok(false, err);
            })
    },
    updateAccount: function(test)
    {
        var that = this;

        var updatedAttributes = {
            name: "Nguyen XTuong",
            password: "111112"
        }

        Q(that.daoFactory.update(updatedAttributes, {email: "hiepkhach7488@gmail.com"}))
            .then(function(affectedRows){
                test.equal(affectedRows, 1);
                return Q(that.daoFactory.find({where: {email: 'hiepkhach7488@gmail.com'}}));
            })
            .then(function(account){
                test.equal(account.password, "111112")
                test.done();
            })
            .fail(function(err){
                test.ok(false, err);
            })
    }
};

exports['Test Sequelize Association Describe'] =
{
    setUp: function(callback)
    {
        var that = this;
        that.modelName = 'AccountActivation';
        callback();
    },
    tearDown: function(callback)
    {
        callback();
    },
    findAssociation: function(test)
    {
        var that = this;
        var daoFactory =  sequelize.daoFactoryManager.getDAO(that.modelName, { attribute: 'tableName' });
        //console.log(daoFactory.associations);
        //console.log(daoFactory.attributes);
        test.done();
    }
}
