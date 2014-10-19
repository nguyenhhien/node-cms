//replication was done using galera cluster + haproxy load balancer
module.exports.adapters = {
    MySQL:
    {
        dbName:					"beaver",
        host:					"127.0.0.1",
        port:                   "33306",
        user:					"root",
        password:				"beaver",
        maxConcurrentQueries:   100,
        poolSize:               100,
        idleTime:               30,
        replication: {
            write: {
                port: "33307",
                poolSize:               30,
                idleTime:               30
            },
            read: {
                port: "33306",
                poolSize:               130,
                idleTime:               30
            }
        }
    },
    Redis:
    {
        host:					"localhost",
        port:					6379,
        pass:					null,
        db:                     6
    },
    Mongo:
    {
        host:                   "localhost",
        port:                   27017,
        db:                     "auth"
    }
};