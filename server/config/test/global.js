module.exports.global = {
    appName: "Beaver.js",
    needAccountActivation: 0,
    sessionSecret: 'auth-secret',
    uploadsFolder: "./public/uploads/",
    protocol: "http",
    host: "cms.beaver.com",
    origin: "http://cms.beaver.com:8889/",
    resourcePrefix: "http://cms.beaver.com:9000/", //nginx prefix
    port: 8889,
    log: {
        level: 'verbose'
    },
    paths: {
        public: '/Users/xuan_tuong/Documents/workspace/projects/auth/public/build',
        controller: '/Users/xuan_tuong/Documents/workspace/projects/auth/server/controllers'
    },
    cache: {
        maxAge: 3600000
    },
    adminEmail: "noreply@beaver.com"
};