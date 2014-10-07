//TODO: TOPMOST important is to handle unhandled exception; like one of the config missing; no error being throws?????
var events              = require('events');
var _                   = require('lodash-node');
var util                = require('util');
var winston             = require('winston');
var async               = require('async');
var Q                   = require("q");
var path                = require("path");
var sailUtil            = require('sails-util');

//extend event emitter
//TODO: check unhandled exception
var Beaver = function(){
    events.EventEmitter.call(this);
    this.setMaxListeners(0);

    //keep track of all child process
    this.childProcesses = [];
}

util.inherits(Beaver, events.EventEmitter);

//start bootstrap application
Beaver.prototype.start = function()
{
    var that = this;

    //attach log file
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Console, {
        colorize: true
    });

    winston.add(winston.transports.File, {
        filename: 'logs.log',
        level: 'info'
    });

    this.winston = winston;

    //load config files: NODE_ENV=development node app.js
    if(process.env.NODE_ENV == "test")
    {
        this.config = _.merge(require('./server/config/index.js').test, require('./server/config/index.js').shared);
    }
    else if(process.env.NODE_ENV == "prod")
    {
        this.config = _.merge(require('./server/config/index.js').prod, require('./server/config/index.js').shared);
    }
    else
    {
        this.config = _.merge(require('./server/config/index.js').dev, require('./server/config/index.js').shared);
    }

    //load hook
    this.hooks = require('./server/hooks');

    //load models
    this.models = require('./server/models');

    //load modules
    this.modules = require('./server/modules');

    //load middleware
    this.middlewares = require('./server/middlewares');

    //some sugar utils function
    this.utils = require("./server/utils.js");

    //init all hooks
    var tasks = [];
    _.each(that.hooks.loadOrders, function(name){
        var hook = that.hooks[name];
        tasks.push(function(next){
            hook.init(that, next);
        });
    });

    //init hook first -- then start bind route + controllers by emit ready event
    async.series(tasks, function(err, data){
        if(err) return that.winston.error("[ERROR]: " + e.stack || e);

        //send ready signal to restart listening
        that.emit('ready');
    });
}

//stop the application
Beaver.prototype.stop = function()
{
    //TODO: peacefully close all database connection
}

//this is only for mocking test
Beaver.prototype.mock = function(callback)
{
    var that = this;

    this.winston = winston;

    this.config = _.merge(require('./server/config/index.js').test, require('./server/config/index.js').shared);

    //load hook
    this.hooks = require('./server/hooks');

    //load models
    this.models = require('./server/models');

    //load modules
    this.modules = require('./server/modules');

    //load middleware
    this.middlewares = require('./server/middlewares');

    //some sugar utils function
    this.utils = require("./server/utils.js");

    that.hooks.loadOrders = [
        "adapter"
    ];

    var tasks = [];
    _.each(that.hooks.loadOrders, function(name){
        var hook = that.hooks[name];
        tasks.push(function(next){
            hook.init(that, next);
        });
    });

    async.series(tasks, function(err, data){
        callback && callback(err);
    });
}

//export only one instance
module.exports = new Beaver();
