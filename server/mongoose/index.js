var fs        = require('fs');
var path      = require('path');
var _         = require('lodash-node');
var mongoose  = require('mongoose-q')();

mongoose.connect('localhost', 'auth');

mongoose.connection.on('open', function() {
    console.log("open mongodb database");
});

mongoose.connection.on('error', function() {
    console.error('connection error', arguments);
});


var db = {};

fs.readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js')
    })
    .forEach(function(file) {
        var model = require(path.join(__dirname, file));
        db[path.basename(file, '.js')] = model;
    });

module.exports = db;