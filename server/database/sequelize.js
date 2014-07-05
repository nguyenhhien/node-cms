'use strict';

(function(module) {
    var winston             = require('winston');
    var Q                   = require("q");
    var Sequelize           = require('sequelize');
    var fs                  = require('fs');
    var path                = require('path');
    var _                   = require('lodash-node');

    module.init = function() {
        var deferred = Q.defer();

        var sequelizeClient = new Sequelize(
            Config.MySQL.dbName,
            Config.MySQL.user,
            Config.MySQL.password,
            {
                logging: false,
                host: Config.MySQL.host,
                maxConcurrentQueries: Config.MySQL.maxConcurrentQueries,
                pool: {
                    maxConnections: Config.MySQL.poolSize,
                    maxIdleTime: Config.MySQL.idleTime
                }
            }
        );

        //initialize the models & sequelize relation
        var models = {};
        var modelDir = path.join(__dirname, "sequelize/models");

        fs.readdirSync(modelDir)
            .filter(function(file) {
                return (file.indexOf('.') !== 0) && (file !== 'index.js')
            })
            .forEach(function(file) {
                var model = sequelizeClient.import(path.join(modelDir, file));
                models[model.name] = model;
            });

        Object.keys(models).forEach(function(modelName) {
            if ('associate' in models[modelName]) {
                //this call method define inside models to establish model relationship
                models[modelName].associate(models)
            }
        })

        sequelizeClient
            .authenticate()
            .complete(function(err) {
                if (!!err) {
                    deferred.reject('Unable to connect to the database:', err);
                } else {
                    winston.info('Connection has been established successfully.');
                    deferred.resolve();
                }
            })

        //export models + client to sequelize
        module = _.extend(module, {
            client: sequelizeClient,
            models: models
        });

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
