module.exports.global = {
    appName: "Beaver.js",
    needAccountActivation: 1,
    sessionSecret: 'auth-secret',
    uploadsFolder: "./public/uploads/",
    protocol: "http",
    host: "auth.epouch.com",
    origin: "http://auth.epouch.com:8888/",
    resourcePrefix: "http://auth.epouch.com:8888/", //nginx prefix
    port: 8888,
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