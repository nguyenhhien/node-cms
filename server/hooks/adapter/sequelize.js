'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var Sequelize           = require('sequelize');
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');

    module.init = function(beaver) {
        var deferred = Q.defer();

        var sequelizeOption = {
            logging: false,
            host: beaver.config.adapters.MySQL.host,
            port: beaver.config.adapters.MySQL.port,
            maxConcurrentQueries: beaver.config.adapters.MySQL.maxConcurrentQueries,
            pool: {
                maxConnections: beaver.config.adapters.MySQL.poolSize,
                maxIdleTime: beaver.config.adapters.MySQL.idleTime
            }
        };

        //if replication was setup
        if(beaver.config.adapters.MySQL.replication)
        {
            sequelizeOption.replication = {
                read: [
                    {
                        port: beaver.config.adapters.MySQL.replication.read.port,
                        maxConcurrentQueries: beaver.config.adapters.MySQL.maxConcurrentQueries,
                        pool: {
                            maxConnections: beaver.config.adapters.MySQL.replication.read.poolSize,
                            maxIdleTime: beaver.config.adapters.MySQL.replication.read.idleTime
                        }
                    }
                ],
                write: {
                    port: beaver.config.adapters.MySQL.replication.write.port,
                    maxConcurrentQueries: beaver.config.adapters.MySQL.maxConcurrentQueries,
                    pool: {
                        maxConnections: beaver.config.adapters.MySQL.replication.write.poolSize,
                        maxIdleTime: beaver.config.adapters.MySQL.replication.write.idleTime
                    }
                }
            }
        }

        var sequelizeClient = new Sequelize(
            beaver.config.adapters.MySQL.dbName,
            beaver.config.adapters.MySQL.user,
            beaver.config.adapters.MySQL.password,
            sequelizeOption
        );

        //initialize the models & sequelize relation
        var models = {};
        Object.keys(beaver.models.sequelize).forEach(function(modelName) {
            var model = sequelizeClient.import(path.join(beaver.models.sequelizePath, modelName));
            models[model.name] = model;
        });

        Object.keys(beaver.models.sequelize).forEach(function(modelName) {
            if ('associate' in models[modelName]) {
                //this call method define inside models to establish model relationship
                models[modelName].associate(models)
            }
        });

        sequelizeClient
            .authenticate()
            .complete(function(err) {
                if (!!err) {
                    deferred.reject('Unable to connect to the database:', err);
                } else {
                    beaver.winston.info('Connection has been established successfully.');
                    //TODO: add sync schema in config
                    module.syncSchema();
                    deferred.resolve();
                }
            })

        //export models + client to sequelize
        module = _.extend(module, {
            client: sequelizeClient,
            models: models
        });

        //also export models to sequelize Models
        beaver.sequelizeModels = models;

        return deferred.promise;
    };

    //sync model and database schema
    module.syncSchema = function()
    {
        winston.info("Start Ensure Schema");
        var queryInterface = module.client.getQueryInterface();

        return Q(queryInterface.showAllSchemas())
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
                module.client.daoFactoryManager.forEachDAO(function(tableFactory, tableName){
                    if(!(tableName in schemaTables)){
                        tasks.push((function(){
                            winston.info("sync schema for table", tableName);
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
                            winston.info("sync " + Object.keys(modelAttributes) + " of table " + tableName);

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
            });
    }

    //close the connections
    module.close = function()
    {
        module.client.connectorManager.disconnect();
    }

}(exports));
