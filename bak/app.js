/**
 * Main entry file: cluster support
 * Run as test process: NODE_ENV=test node app.js
 * Run as ES6-Harmony: NODE_ENV=test node11harmony app.js (node11harmony point to node0.11.13)
 */
switch(process.env.NODE_ENV)
{
    case 'test':
        global.Config = require("./../server/config.js").test;
        break;
    case 'production':
        global.Config = require("./../server/config.js").production;
        break;
    default:
        global.Config = require("./../server/config.js").development;
        break;
}

require("./../server/constant.js");

//third-party modules
var express 			= require("express");
var cluster             = require('cluster');
var path                = require("path");
var fs					= require("fs");
var http				= require("http");
var fse					= require("fs-extra");
var async				= require("async");
var util				= require("util");
var Q                   = require("q");
var asyncQ              = require("async-q");
var log4js              = require('log4js');
var session             = require('express-session');
var RedisStore          = require('connect-redis')(session);
var passport            = require('passport');
var jwt                 = require('express-jwt');
var expressValidator    = require('express-validator');
var gzippo              = require('gzippo');
var winston             = require('winston');
var os                  = require('os');
var ActiveSuport        = require('activesupport/active-support-node.js');

//app modules
var utils               = require("./server/helpers/Utils.js");
var restful             = require('./server/helpers/SequelizeRestfulRouter.js');
var routes              = require("./server/routes");
var sequelize           = require("./server/database/sequelize.js");
var redis               = require("./server/database/redis.js");
var mongo               = require("./server/database/mongo.js");
var mongoose            = require('./server/database/mongoose.js');

//sugar function for generator
global.asyncCallback = function(gen) {
    return function() {
        return Q.async(gen).apply(null, arguments).done();
    };
}

//winston log transport
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true
});

winston.add(winston.transports.File, {
    filename: 'logs.log',
    level: 'info'
});

//cluster support
if (cluster.isMaster) {
    sequelize.init()
        .then(function(){
            return sequelize.syncSchema();
        })
        .then(function(){
            var cpuCount = require('os').cpus().length;

            winston.info("Fork process in " + cpuCount + " CPUs");

            // Create a worker for each CPU
            for (var i = 0; i < cpuCount; i += 1) {
                cluster.fork();
            }
        })
        .fail(function(error){
            winston.error("[cluster fork, sync schema] Error: ", error.stack || error);
        });
}
else
{
    //webserver process, then open all connections to redis, mongo, sequelize
    Q.all([redis.init(), mongo.init(), mongoose.init(), sequelize.init()])
        .then(function(){
            var app	= express();

            app.enabled('trust proxy');
            app.enable("jsonp callback");

            //TODO: remove; use 3 different middleware instead - express 3.0
            app.use(require("body-parser")({ uploadDir: Config.UploadsFolder}));

            //using param validator
            app.use(expressValidator({
                errorFormatter: function(param, msg, value) {
                    var namespace = param.split('.')
                        , root    = namespace.shift()
                        , formParam = root;

                    while(namespace.length) {
                        formParam += '[' + namespace.shift() + ']';
                    }
                    return {
                        param : formParam,
                        msg   : msg,
                        value : value
                    };
                }
            }));

            app.use(require("cookie-parser")());
            app.use(require("express-session")({
                key: 'sid',
                store:  new RedisStore({
                    host: 	Config.Redis.host,
                    port:	Config.Redis.port,
                    db:		Config.Redis.db,
                    pass:	Config.Redis.pass,
                    client:	redis.client
                }),
                maxAge: 3600000,
                secret: Config.Global.sessionSecret
            }));

            //extend response header
            require("./server/helpers/ResponseHelper.js")(http);

            //setup route -- this will route corresponding resquest to correct route handler
            routes(app);

            //set necessary header -- for CORS
            app.use(function(req, res, next)
            {
                res.header('Access-Control-Allow-Origin', req.get('origin')); //allow CORS
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type');
                res.header('Access-Control-Allow-Credentials', true); //allow CORS

                next();
            });

            //app.use("/", express.static(__dirname + "/public/build"));		// serve public files straight away
            app.use(gzippo.staticGzip(__dirname + '/public/build')); //TODO: move to nginx gzip

            //setup restful API endpoint
            app.use(restful(sequelize.client, {
                endpoint: '/api/restful',
                allowed: [
                    {
                        tableName: "User",
                        //attributes cannot be update
                        restrictedWriteAttributes: ["email", "password"],
                        //attribute will not be returned
                        restrictedReadAttributes: ["password"],
                        //list of restful method allowed
                        allowedMethods: ["GET", "PUT"]
                    }
                ]
            }));

            //socket io setup
            var server = http.Server(app);

            var socketIO = require("./../server/socket/socket.js");
            socketIO.init(server);

            //app start listening
            server.listen(Config.PORT, function()
            {
                winston.log("Web server process listening on %s:%d ", Config.PORT);
            });
        })
        .fail(function(error){
            winston.error(error.stack || error);
        });
}


