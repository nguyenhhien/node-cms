var Users = require("./Users");

//set up router for the main app
module.exports = function(app)
{
    app.use('/api/users', Users);
}