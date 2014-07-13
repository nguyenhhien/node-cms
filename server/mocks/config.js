UploadsFolder 		= "./public/uploads/";
HOSTURL             = "http://auth.epouch.com:8888/"
PORT				= "8888";

Config =
{
    Global: {
        appName: "ePouch",
        needAccountActivation: 1,
        sessionSecret: 'auth-secret'
    },
    MySQL:
    {
        dbName:					"auth-test",
        host:					"127.0.0.1",
        user:					"root",
        password:				null,
        maxConcurrentQueries:  100,
        poolSize:   3,
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
}
