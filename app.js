require("./server/config.js");

var model               = require("./server/models");
var express 			= require("express");
var path                = require("path");
var fs					= require("fs");
var fse					= require("fs-extra");
var async				= require("async");
var util				= require("util");
var Q                   = require("q");
var asyncQ              = require("async-q");
var log4js              = require('log4js');
var session             = require('express-session')
var RedisStore          = require('connect-redis')(session);

var Database            = require("./server/database");

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

var app	= express();

app.enabled('trust proxy');
app.enable("jsonp callback");

app.use(require("body-parser")({ uploadDir: UploadsFolder}));

//set necessary header -- for CORS
app.use(function(req, res, next)
{
    res.header('Access-Control-Allow-Origin', req.get('origin'));
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', true);

    next()
});

var redisStoreConfig = new RedisStore({
    host: 	Config.Redis.host,
    port:	Config.Redis.port,
    db:		3,
    pass:	Config.Redis.pass,
    client:	Database.getRedisCli()
});

app.use(require("cookie-parser")());
app.use(require("express-session")({
    key: 'sid',
    store: redisStoreConfig,
    maxAge: 3600000,
    secret: 'auth-secret'
}));

app.use("/", express.static(__dirname + "/public/build"));		// serve public files straight away


app.listen(PORT, function()
{
    console.log("Web server process listening on %s:%d ", PORT);
});



