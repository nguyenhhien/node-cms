var Sequelize = require('sequelize');
var fs        = require('fs');
var path      = require('path');
var _         = require('lodash-node');

// initialize database connection
var sequelize = new Sequelize(
    Config.MySQL.dbName,
    Config.MySQL.user,
    Config.MySQL.password,
    {
        logging: false,
        host: Config.MySQL.host,
        maxConcurrentQueries: Config.MySQL.maxConcurrentQueries,
        pool: {
            maxConnections: Config.MySQL.poolSize,
            maxIdleTime: Config.MySQL.idleTime
        },
        define: {
            //common class methods
            classMethod: {
                slugify: function(str) {
                    var from  = "ąàáäâãåæćęèéëêìíïîłńòóöôõøśùúüûñçżź",
                        to    = "aaaaaaaaceeeeeiiiilnoooooosuuuunczz",
                        regex = new RegExp('[' + from.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1') + ']', 'g');

                    if (str == null) return '';

                    str = String(str).toLowerCase().replace(regex, function(c) {
                        return to.charAt(from.indexOf(c)) || '-';
                    });

                    return str.replace(/[^\w\s-]/g, '').replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
                }
            },
            //instance method
            instanceMethods: {

            }
        }
    }
);

var db = {};
fs.readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js')
    })
    .forEach(function(file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(function(modelName) {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db)
    }
})

module.exports = _.extend({
    sequelize: sequelize
}, db);
