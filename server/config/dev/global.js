module.exports.global = {
    appName: "Beaver.js",
    needAccountActivation: 1,
    sessionSecret: 'auth-secret',
    uploadsFolder: "./uploads/",
    protocol: "http",
    host: "cms.beaver.com",
    origin: "http://cms.beaver.com:8080/",
    resourcePrefix: "http://cms.beaver.com:9000/", //nginx prefix
    port: 8080,
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