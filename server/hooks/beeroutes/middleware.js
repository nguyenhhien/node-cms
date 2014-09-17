//Support RESTFUL -- eg. http://localhost:8888/api/user?where=["id > ?", "25"]&limit=1&offset=0&attributes=["id", ["name", "title"]]
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

//TODO: optimize the search in-case of large model name
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

function tryToParseJSON (json) {
    if (!_.isString(json)) return null;
    try {
        return JSON.parse(json);
    }
    catch (e) { return e; }
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

        var criteria = {};

        //TODO: check SQL injection
        var where = req.param('where');
        if (_.isString(where)) {
            where = tryToParseJSON(where.trim());
        }

        if(where) criteria.where = where;

        var attributes = req.param('attributes');
        if (_.isString(attributes)) {
            attributes = tryToParseJSON(attributes);
        }

        if(attributes) criteria.attributes = attributes;

        var include = req.param('include');
        if (_.isString(attributes)) {
            include = tryToParseJSON(include);
        }

        if(include) criteria.include = include;

        var order = req.param('order');
        if (_.isString(order)) {
            order = tryToParseJSON(order);
        }

        if(order) criteria.order = order;

        //TODO: if post the criteria but invalid JSON, throw the error immediately
        var sequelizeModelName = that.matchModelNameIgnoreCase(modelName);

        //default limit -- by default don't allow retrieve without offset and limit
        if(limit == null) limit = 30;
        if(offset == null) offset = 0;

        //TODO: check association support
        function find()
        {
            if(limit != null && offset != null)
            {
                criteria = _.merge({offset: offset, limit: limit}, criteria);
                return Q(that.daoFactories[sequelizeModelName].findAndCountAll(criteria));
            }
            else
            {
                return Q(that.daoFactories[sequelizeModelName].findAll(criteria));
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

        //TODO: omit some variable inside body
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

        //TODO: omit some variable inside body
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

