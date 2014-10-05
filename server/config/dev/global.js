module.exports.global = {
    appName: "Beaver.js",
    needAccountActivation: 1,
    sessionSecret: 'auth-secret',
    uploadsFolder: "./uploads/",
    protocol: "http",
    host: "auth.epouch.com",
    origin: "http://auth.epouch.com:8080/",
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