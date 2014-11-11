module.exports.global = {
    appName: "Beaver.js",
    needAccountActivation: 0,
    sessionSecret: 'auth-secret',
    uploadsFolder: "./uploads/",
    protocol: "http",
    host: "cms.pingbit.com",
    origin: "http://cms.pingbit.com/",
    resourcePrefix: "http://cms.pingbit.com/", //nginx prefix
    port: 8080,
    log: {
        level: 'verbose'
    },
    paths: {
        public: '/home/ubuntu/workplace/beaver/public/build',
        controller: '/home/ubuntu/workplace/beaver/server/controllers'
    },
    cache: {
        maxAge: 3600000
    },
    adminEmail: "noreply@beaver.com",
    chatPageSize: 100
};