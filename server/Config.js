UploadsFolder 		= "./public/uploads/";
HOSTURL             = "http://auth.epouch.com:8888/"
PORT				= "8888";

Config =
{
    Global: {
        appName: "ePouch",
        needAccountActivation: 1
    },
    MySQL:
    {
        dbName:					"auth",
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
        db:                     3
    },
    Mongo:
    {
        host:                   "localhost",
        port:                   27017,
        db:                     "auth"
    },
    Oath:
    {
        twitterConsumerKey: "P1XmEmbi1fxKQGpqQFcbz7tVz",
        twitterConsumerSecret: "shNtpt2FbkOyAajbiLitJ3T0yo8HxZJz1Na4JeilAaqX6aUn8L"
    }
}