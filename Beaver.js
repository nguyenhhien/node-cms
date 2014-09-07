var events              = require('events');
var _                   = require('lodash-node');
var util                = require('util');
var winston             = require('winston');
var async               = require('async');
var Q                   = require("q");

//extend event emitter
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

    //load config files
    //TODO: check process env and load corresponding config
    this.config = require('./server/config/index.js').dev;

    //load hook
    this.hooks = require('./server/hooks');

    //load models
    this.models = require('./server/models');

    //init all hooks
    var tasks = [];
    _.each(this.hooks, function(hook){
        tasks.push(function(next){
            hook.init(that, next);
        });
    });

    async.series(tasks, function(err, data){
        //send ready single to restart listening
        that.emit('ready');
    });
}

//stop the application
Beaver.prototype.stop = function()
{

}


module.exports = Beaver;
