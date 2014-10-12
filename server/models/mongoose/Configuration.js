var mongoose        = require('mongoose');
var Schema          = mongoose.Schema;

//the schema should be kept as close as the configuration in config folder so that it can override easily
var configurationSchema = new Schema({
    global: {
        appName: String,
        needAccountActivation: Number,
        resourcePrefix: String,
        log: {
            level: String
        },
        cache: {
            maxAge: String
        },
        adminEmail: String
    },
    adapters:
    {
        MySQL:
        {
            dbName:					String,
            host:					String,
            user:					String,
            replication: {
                write: {
                    port: String,
                    poolSize:       Number,
                    idleTime:       Number
                },
                read: {
                    port: String,
                    poolSize:       Number,
                    idleTime:       Number
                }
            }
        },
        Redis:
        {
            host:					String,
            port:					String,
            pass:					String,
            db:                     Number
        },
        Mongo:
        {
            host:                   String,
            port:                   String,
            db:                     String
        }
    },
    oath:
    {
        Facebook:
        {
            clientId: String,
            clientSecret: String
        },
        Google:
        {
            clientId: String,
            clientSecret: String
        }
    },
    thirdparty:
    {
        Mandrill: {
            apiKey: String, //api key to send email
            userName: String, //password for test account is same as userName
            host: String,
            port: String
        }
    }
});

var Configuration = mongoose.model('Configuration', configurationSchema);

module.exports = Configuration;