/**
 * Test Email: hardsmashme@gmail.com
 * Password: smashsmash
 * Google App: https://console.developers.google.com/project
 */
module.exports = (function(){
    //config for production server
    var ConfigProduction = {
        UploadsFolder: "./public/uploads/",
        HOSTURL: "http://auth.epouch.com:8888/",
        PORT: 8888,
        Global: {
            appName: "ePouch",
            needAccountActivation: 1,
            sessionSecret: 'auth-secret'
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
            db:                     6
        },
        Mongo:
        {
            host:                   "localhost",
            port:                   27017,
            db:                     "auth"
        },
        Facebook:
        {
            clientId: "627149314039365",
            clientSecret: "d77d4e2ed58e4e2aac4fe18bd01c917c"
        },
        Google:
        {
            clientId: "136519802127.apps.googleusercontent.com",
            clientSecret: "U2UUoh0KvaFSt0HDeG700sLD"
        }
    };

    //config development is almost same as production configuration
    var ConfigDevelopment = {
        UploadsFolder: "./public/uploads/",
        HOSTURL: "http://auth.epouch.com:8888/",
        PORT: 8888,
        Global: {
            appName: "ePouch",
            needAccountActivation: 0,
            sessionSecret: 'auth-secret'
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
            db:                     6
        },
        Mongo:
        {
            host:                   "localhost",
            port:                   27017,
            db:                     "auth"
        },
        Facebook:
        {
            clientId: "627149314039365",
            clientSecret: "d77d4e2ed58e4e2aac4fe18bd01c917c"
        },
        Google:
        {
            clientId: "136519802127.apps.googleusercontent.com",
            clientSecret: "U2UUoh0KvaFSt0HDeG700sLD"
        }
    };

    var ConfigTest = {
        UploadsFolder: "./public/uploads/",
        HOSTURL: "http://auth.epouch.com:8889/",
        PORT: 8889,
        Global: {
            appName: "ePouch",
            needAccountActivation: 0,
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
        },
        Facebook:
        {
            clientId: "627149314039365",
            clientSecret: "d77d4e2ed58e4e2aac4fe18bd01c917c",
            testUser: {
                email: "open_ouafxib_user@tfbnw.net",
                name: "Open Graph Test User",
                userId: "100008244009725"
            }
        },
        Google:
        {
            clientId: "136519802127.apps.googleusercontent.com",
            clientSecret: "U2UUoh0KvaFSt0HDeG700sLD",
            //refresh token obtained from https://developers.google.com/oauthplayground
            testUser: {
                email: "hardsmashme@gmail.com",
                name: "Smash me",
                userId: "106351270674292229585",
                password: "smashsmash",
                refreshToken: "1/_73MHFa86rdz1qFcKG5x3HQZmpntGudQ3XEhFJAd9y0"
            }
        }
    }

    return {
        'test': ConfigTest,
        'development': ConfigDevelopment,
        'production': ConfigProduction
    }
})();
