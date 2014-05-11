var _                       = require('lodash-node');
var querystring             = require('querystring');
var Q                       = require('q');
var connect                 = require('connect');

var Router = function(sequelize, options) {
    var that = this;

    this.sequelize = sequelize
    this.options   = _.extend({
        endpoint: '/api',
        logLevel: 'info',
        allowed: []
    }, options || {})

    //cache list of attributes which is restricted to update from client such as user.email
    this.restrictedWriteAttributes = _.transform(this.options.allowed, function(results, elem){
        results[elem.tableName] = elem.restrictedWriteAttributes;
    });
    this.restrictedReadAttributes = _.transform(this.options.allowed, function(results, elem){
        results[elem.tableName] = elem.restrictedReadAttributes;
    });

    //list of table names to expose to rest endpoint
    this.allowedModelNames = _.map(this.options.allowed, function(elem){return elem.tableName;});

    //cache dao factories
    this.daoFactories =  _.transform(this.options.allowed, function(results, elem){
        results[elem.tableName] = that.sequelize.daoFactoryManager.getDAO(elem.tableName, { attribute: 'tableName' });
    });

    that.allowedWriteAttributes = _.transform(this.options.allowed, function(results, elem){
        results[elem.tableName] = _.filter(Object.keys(that.daoFactories[elem.tableName].attributes), function(attribute){
            return (that.restrictedWriteAttributes[elem.tableName] || []).indexOf(attribute) == -1;
        });
    })

    that.allowedReadAttributes = _.transform(this.options.allowed, function(results, elem){
        results[elem.tableName] = _.filter(Object.keys(that.daoFactories[elem.tableName].attributes), function(attribute){
            return (that.restrictedReadAttributes[elem.tableName] || []).indexOf(attribute) == -1;
        });
    });
}

//Check if user can access/modify resource
Router.prototype.checkPermission = function(req, modelName, id, associatedModelName, associatedModelId)
{
    var forbiddenMsg = "Access forbidden for the resource";

    //if model's name is not allowed in the white list; reject immediately
    if(this.allowedModelNames.length > 0 && this.allowedModelNames.indexOf(modelName) == -1)
    {
        return Q.reject(forbiddenMsg);
    }

    //id, if provided; must be integer
    if(id != null && parseInt(id) === NaN)
    {
        return Q.reject("Invalid resource id " + id);
    }

    //get userID from session
    var userId = req.session.user;

    switch(modelName)
    {
        case 'Account':
            if(id == null && req.method != 'GET')
            {
                return Q.reject(forbiddenMsg);
            }
            else if(id != null && id != userId)
            {
                return Q.reject(forbiddenMsg);
            }
            else return Q.resolve();

            break;

        default:
            return Q.resolve();
            break;
    }
}

Router.prototype.isRestfulRequest = function(path) {
    return path.indexOf(this.options.endpoint) === 0
}

Router.prototype.splitPath = function(path){
    var regex = new RegExp("^" + this.options.endpoint + "/?([^/]+)?/?([^/]+)?/?([^/]+)?/?([^/]+)?$")
        , match = path.match(regex)
        , rest_params = new Array();

    for(var i=1; i < match.length; i++){
        if (typeof match[i] != 'undefined'){
            rest_params.push(match[i])
        }
    }

    return rest_params
}


Router.prototype.handleRequest = function(req, res) {
    var match = this.splitPath(req.path)
    var that = this;

    switch(match.length) {
        // requested path: /api/dao_factory
        case 1:
            var modelName = match[0]

            //check permission first; then execute the method
            that.checkPermission(req, modelName)
                .then(function(){
                    return (function(){
                        switch(req.method) {
                            case "GET":
                                var limit = req.query.limit,
                                    offset = req.query.offset;

                                //return pagination data
                                if(limit != null && offset != null)
                                {
                                    return Q(that.daoFactories[modelName].findAndCountAll({offset: offset, limit: limit, attributes: that.allowedReadAttributes[modelName]}));
                                }
                                else
                                {
                                    return Q(that.daoFactories[modelName].findAll({attributes: that.allowedReadAttributes[modelName]}));
                                }

                                break
                            case "POST":
                                return Q(that.daoFactories[modelName].create(req.body));

                                break
                            default:
                                return Q.reject('Method not available for this pattern.')

                                break
                        }
                    })();
                })
                .then(function(result){
                    res.success(result);
                })
                .fail(function(err){
                    res.error(err);
                })

            break

        // requested path: /api/dao_factory/1
        case 2:

            var modelName = match[0]
            var identifier = match[1]

            that.checkPermission(req, modelName, identifier)
                .then(function(){
                    (function(){
                        switch(req.method) {
                            case "GET":
                                return Q(that.daoFactories[modelName].find({ where: {id: identifier}, attributes: that.allowedReadAttributes[modelName]}));
                                break
                            case 'DELETE':
                                return Q(that.daoFactories[modelName].destroy({ where: {id: identifier}}));
                                break
                            case 'PUT':
                                return Q(that.daoFactories[modelName].update(req.body, that.allowedWriteAttributes[modelName]));
                                break

                            default:
                                return Q.reject('Method not available for this pattern.')
                                break
                        }
                    })()
                })
                .then(function(result){
                    res.success(result);
                })
                .fail(function(err){
                    res.error(err);
                });


        default:
            res.error('Route does not match known patterns.')
            break
    }
}


module.exports = function(sequelize, options)
{
    var router = new Router(sequelize, options);

    return function(req, res, next)
    {
        if(router.isRestfulRequest(req.path))
        {
            router.handleRequest(req, res);
        }
        else next();
    }
}
