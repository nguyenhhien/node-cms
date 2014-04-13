var model               = require("./models");
var fs					= require("fs");
var fse					= require("fs-extra");
var async				= require("async");
var util				= require("util");
var Q                   = require("q");
var asyncQ              = require("async-q");
var Sequelize           = require('sequelize');
var redis               = require("redis");

var sequelize = model.sequelize;
var queryInterface = sequelize.getQueryInterface();

module.exports = (function() {
    var redisCli;

    var Database = function(){
        redisCli = redis.createClient(Config.Redis.port, Config.Redis.host);
        redisCli.on("error", function(err)
        {
            logger.error("Redis error: ", err);
        });
    }

    Database.prototype.init = function()
    {

    }

    Database.prototype.getRedisCli = function()
    {
        return redisCli;
    }

    Database.prototype.syncSchema = function()
    {
        logger.info("Start Ensure Schema");

        Q(queryInterface.showAllSchemas())
            .then(function(allTables){
                var tasks = allTables.map(function(tableName){
                    return queryInterface.describeTable(tableName).then(function(attributes){
                        return {
                            table: tableName,
                            attributes: attributes
                        };
                    });
                })

                return Q.all(tasks);
            })
            .then(function(results){
                var schemaTables = {}

                results.forEach(function(elem){
                    if(elem.table in schemaTables) return;
                    schemaTables[elem.table] = elem.attributes;
                })

                //need to sync the database model
                var tasks = [];
                sequelize.daoFactoryManager.forEachDAO(function(tableFactory, tableName){
                    if(!(tableName in schemaTables)){
                        tasks.push((function(){
                            logger.info("sync schema for table", tableName);
                            return tableFactory.sync(tableFactory.options);
                        })())
                    }
                    else
                    {
                        var modelAttributes = tableFactory.attributes;
                        for(var attribute in modelAttributes)
                        {
                            if(attribute in schemaTables[tableName]) delete modelAttributes[attribute];
                        }

                        //generate add column query
                        if(Object.keys(modelAttributes).length > 0)
                        {
                            logger.info("sync " + Object.keys(modelAttributes) + " of table " + tableName);

                            //insert multiple collumn at once
                            var Utils = Sequelize.Utils;
                            var query      = "ALTER TABLE `<%= tableName %>` <%= attributes %>;"
                                , attrString = [];

                            for (var attrName in modelAttributes) {
                                var definition = modelAttributes[attrName]

                                attrString.push(Utils._.template('ADD `<%= attrName %>` <%= definition %>')({
                                    attrName: attrName,
                                    definition: queryInterface.QueryGenerator.mysqlDataTypeMapping(tableName, attrName, definition)
                                }))
                            }

                            var query = Utils._.template(query)({ tableName: tableName, attributes: attrString.join(', ') });

                            tasks.push((function(){
                                return queryInterface.queryAndEmit(query, "addColumn");
                            })());
                        }
                    }
                });

                return Q.all(tasks);
            })
            .fail(function(err){
                logger.error("error occur: ", err);
            })
            .done(function(err){
                logger.info("Ensure schema was run successfully");
            });
    }

    var singleton = function singleton(){}
    singleton.instance = null;

    singleton.getInstance = function()
    {
        if(!singleton.instance) return new Database();
        else return singleton.instance;
    }

    return singleton.getInstance();

})();