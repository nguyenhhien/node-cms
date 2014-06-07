require("./server/config.js");
require("./server/constant.js");

var models              = require("./server/models");
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
var session             = require('express-session')
var RedisStore          = require('connect-redis')(session);
var passport            = require('passport');
var jwt                 = require('express-jwt');
var routes              = require("./server/routes");
var expressValidator    = require('express-validator');
var utils               = require("./server/helpers/Utils.js");
var restful             = require('./server/helpers/SequelizeRestfulRouter.js');
var gzippo              = require('gzippo');
var ActiveSuport        = require('activesupport/active-support-node.js');
var mongooseModel       = require('./server/mongoose');


var Database            = require("./server/database");

//set logger information
log4js.configure({
    "appenders": [
        {
            type: "file",
            filename: path.join(__dirname, "logs.log"),
            "category" : "main"
        },
        {
            type: "console"
        }
    ],
    replaceConsole: true
});

logger = log4js.getLogger("main");
logger.setLevel("INFO");


if (cluster.isMaster) {
    //sync schema model definition
    //TODO: add callback and only fork after sync success
    Database.syncSchema();

    var cpuCount = require('os').cpus().length;

    console.log("Fork process in " + cpuCount + " CPUs");

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }
}
else
{

    var app	= express();

    app.enabled('trust proxy');
    app.enable("jsonp callback");

    //TODO: remove; use 3 different middleware instead - express 3.0
    app.use(require("body-parser")({ uploadDir: UploadsFolder}));

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
            db:		3,
            pass:	Config.Redis.pass,
            client:	Database.getRedisCli()
        }),
        maxAge: 3600000,
        secret: 'auth-secret'
    }));

    //extend response header
    require("./server/helpers/ResponseHelper.js")(http);

    //set necessary header -- for CORS
    app.use(function(req, res, next)
    {
        res.header('Access-Control-Allow-Origin', req.get('origin')); //allow CORS
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Access-Control-Allow-Credentials', true); //allow CORS

        next()
    })

    //setup route
    routes(app);

    //app.use("/", express.static(__dirname + "/public/build"));		// serve public files straight away
    app.use(gzippo.staticGzip(__dirname + '/public/build'));

    //setup sequelize restful API endpoint
    app.use(restful(models.sequelize, {
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

    app.listen(PORT, function()
    {
        console.log("Web server process listening on %s:%d ", PORT);
    });
}


