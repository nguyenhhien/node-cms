var Sequelize = require('sequelize');

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
        }
    }
);

// load models
var models = [
    'Account',
    'AccountActivation'
];
models.forEach(function(model) {
    module.exports[model] = sequelize.import(__dirname + '/' + model);
});

// describe relationships
(function(m) {
    m.AccountActivation.belongsTo(m.Account, {foreignKeyConstraint: true});
})(module.exports);

// export connection
module.exports.sequelize = sequelize;