var passport = require('passport');
var Auth0Strategy = require('passport-auth0');

var strategy = new Auth0Strategy({
    domain:       'tauth.auth0.com',
    clientID:     'IJbRfmuIj3NYL6oe9el13JOZkTk2Iw3u',
    clientSecret: 'wReI8rpRzLcBt7noEw7MKcR4WZhS3RL16Xyb7iH954XFLJgmiTd6u-Sqpz18wUZT',
    callbackURL:  'http://localhost:8888/'
}, function(accessToken, refreshToken, profile, done) {
    //Some tracing info
    console.log('profile is', profile);
    return done(null, profile);
});

passport.use(strategy);

// This is not a best practice, but we want to keep things simple for now
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

module.exports = strategy;