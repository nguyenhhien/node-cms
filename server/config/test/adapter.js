//connect to virtualbox mysql gallera cluster
module.exports.adapters = {
    MySQL:
    {
        dbName:					"auth",
        host:					"127.0.0.1",
        port:                   "3306",
        user:					"root",
        password:				null,
        maxConcurrentQueries:  100,
        poolSize:   100,
        idleTime: 30
    },
    Redis:
    {
        host:					"localhost",
        port:					6379,
        pass:					null,
        db:                     5
    },
    Mongo:
    {
        host:                   "localhost",
        port:                   27017,
        db:                     "auth-test"
    }
};