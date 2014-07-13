var User       = require("./User");
var Comment    = require("./Comment");
var Location    = require("./Location");

//set up router for the main app
module.exports = function(app)
{
    //return list of all countries
    app.get("/api/countries", function(req, res){
        res.success(CountryList);
    })

    //import other modules
    app.use('/api/users', User);

    //other router
    app.use('/api', Comment);
    app.use('/api', Location);
}