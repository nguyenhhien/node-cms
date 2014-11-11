//replication was done using galera cluster + haproxy load balancer
module.exports.adapters = {
    MySQL:
    {
        dbName:					"beaver",
        host:					"rds1.cyjzxce0sqyz.ap-southeast-1.rds.amazonaws.com",
        port:                   "3306",
        user:					"root",
        password:				"nodebeaver",
        maxConcurrentQueries:   100,
        poolSize:               100,
        idleTime:               30,
        replicationno: {
            write: {
                port: "3306",
                poolSize:               30,
                idleTime:               30
            },
            read: {
                port: "3306",
                poolSize:               130,
                idleTime:               30
            }
        }
    },
    Redis:
    {
        host:					"aws1.gzkvyj.0001.apse1.cache.amazonaws.com",
        port:					6379,
        pass:					null,
        db:                     2
    },
    Mongo:
    {
        host:                   "localhost",
        port:                   27017,
        db:                     "auth"
    }
};