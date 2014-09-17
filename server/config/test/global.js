module.exports.global = {
    appName: "Beaver.js",
    needAccountActivation: 1,
    sessionSecret: 'auth-secret',
    uploadsFolder: "./public/uploads/",
    protocol: "http",
    host: "auth.epouch.com",
    origin: "http://auth.epouch.com:8888/",
    port: 8888,
    log: {
        level: 'verbose'
    },
    paths: {
        public: '/public/build'
    },
    cache: {
        maxAge: 3600000
    }
};