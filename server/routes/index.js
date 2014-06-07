var Users       = require("./Users");
var Comments    = require("./Comments");

//set up router for the main app
module.exports = function(app)
{
    //return list of all countries
    app.get("/api/countries", function(req, res){
        res.success(CountryList);
    })

    //import other modules
    app.use('/api/users', Users);

    app.use('/api', Comments);
}