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

//some suger functions
function getUtil()
{
    function util()
    {
        this.formatValidationError = function(errors)
        {
            errors = errors || [];

            //remove duplicate element
            errors = errors.filter(function(elem, pos) {
                return errors.map(function(error){return error.param;}).indexOf(elem.param) == pos;
            });

            var errorMsg = "Invalid Params (";
            errorMsg += (errors || []).map(function(elem){
                return elem.param;
            }).join(",") + ")";

            errorMsg += " .Received (" +  (errors || []).map(function(elem){
                return elem.value;
            }).join(",") + ")";

            return errorMsg;
        }

        this.regexEscape= function(s) {
            return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        };
    }

    return new util();
}

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

    //load config files
    //TODO: check process env and load corresponding config
    this.config = _.merge(require('./server/config/index.js').dev, require('./server/config/index.js').shared);

    //load hook
    this.hooks = require('./server/hooks');

    //load models
    this.models = require('./server/models');

    //load modules
    this.modules = require('./server/modules');

    this.utils = getUtil();

    //init all hooks
    var tasks = [];
    _.each(that.hooks.loadOrders, function(name){
        var hook = that.hooks[name];
        tasks.push(function(next){
            hook.init(that, next);
        });
    });

    //init hook first -- then start bind route + controllers
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

//export only one instance
module.exports = new Beaver();
