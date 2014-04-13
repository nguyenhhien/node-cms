UploadsFolder 		= "./public/uploads/";
PORT				= "8888";

Config =
{
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
        pass:					null
    }
}