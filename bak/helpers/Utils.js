module.exports = (function()
{
    this.formatValidationError = function(errors)
    {
        errors = errors || [];

        //remove duplicate element
        errors = errors.filter(function(elem, pos) {
            return errors.map(function(error){return error.param;}).indexOf(elem.param) == pos;
        });

        var errorMsg = "Invalid Params (";
        errorMsg += (errors || []).map(function(elem){
            return elem.param;
        }).join(",") + ")";

        errorMsg += " .Received (" +  (errors || []).map(function(elem){
            return elem.value;
        }).join(",") + ")";

        return errorMsg;
    }

    this.randomString = function(length)
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < length; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    this.regexEscape= function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    return this;
})();