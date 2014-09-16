var winston             = require('winston');
var Q                   = require("q");
var fs                  = require('fs');
var path                = require('path');
var _                   = require('lodash-node');

var MiddleWareFactory = function (beaver) {
    var that = this;

    this.sequelizeModels = Object.keys(beaver.models.sequelize);

    //cache dao factories
    this.daoFactories =  _.transform(this.sequelizeModels, function(results, elem){
        results[elem] = beaver.sequelize.client.daoFactoryManager.getDAO(elem, { attribute: 'tableName' });
    });
}

//TODO: optimize the search incase of large model name
MiddleWareFactory.prototype.matchModelNameIgnoreCase = function(modelName)
{
    var foundModelName;

    this.sequelizeModels.forEach(function(elem){
        if(elem.toLowerCase() == modelName.toLowerCase())
        {
            foundModelName = elem;
        }
    });

    return foundModelName;
}

//find one single instance
MiddleWareFactory.prototype.findOne = function(modelName)
{
    var that = this;
    return function(req, res)
    {
        var id = req.param('id');
        var sequelizeModelName = that.matchModelNameIgnoreCase(modelName);

        Q(that.daoFactories[sequelizeModelName].find({ where: {id: id}}))
            .then(function(data){
                res.json(data);
            })
            .fail(function(error){
                res.json({
                   error: error.stack || error
                });
            });
    }
}

MiddleWareFactory.prototype.find = function(modelName)
{
    var that = this;
    return function(req, res)
    {
        var limit = req.param('limit'),
            offset = req.param('offset');

        var sequelizeModelName = that.matchModelNameIgnoreCase(modelName);

        //default limit -- by default don't allow retrieve without offset and limit
        if(limit == null) limit = 30;
        if(offset == null) offset = 0;

        //TODO: add where, populate criteria
        function find()
        {
            if(limit != null && offset != null)
            {
                return Q(that.daoFactories[sequelizeModelName].findAndCountAll({offset: offset, limit: limit}));
            }
            else
            {
                return Q(that.daoFactories[sequelizeModelName].findAll());
            }
        }

        find()
            .then(function(data){
                res.json(data);
            })
            .fail(function(error){
                res.json({
                    error: error.stack || error
                });
            });
    }
}


MiddleWareFactory.prototype.update = function(modelName)
{
    var that = this;
    return function(req, res)
    {
        var id = req.param('id');
        var sequelizeModelName = that.matchModelNameIgnoreCase(modelName);

        Q(that.daoFactories[sequelizeModelName].update(req.body, {id: id}))
            .then(function(data){
                res.json(data);
            })
            .fail(function(error){
                res.json({
                    error: error.stack || error
                });
            });
    }
}


MiddleWareFactory.prototype.destroy = function(modelName)
{
    var that = this;
    return function(req, res)
    {
        var id = req.param('id');
        var sequelizeModelName = that.matchModelNameIgnoreCase(modelName);

        Q(that.daoFactories[sequelizeModelName].destroy({ where: {id: id}}))
            .then(function(data){
                res.json(data);
            })
            .fail(function(error){
                res.json({
                    error: error.stack || error
                });
            });
    }
}


MiddleWareFactory.prototype.create = function(modelName)
{
    var that = this;
    return function(req, res)
    {
        var sequelizeModelName = that.matchModelNameIgnoreCase(modelName);
        Q(that.daoFactories[sequelizeModelName].create(req.body))
            .then(function(data){
                res.json(data);
            })
            .fail(function(error){
                res.json({
                    error: error.stack || error
                });
            });
    }
}

module.exports = MiddleWareFactory;

