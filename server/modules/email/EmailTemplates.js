var fs 					= require("fs");

/**
 * Default email templates loaded into memory to avoid loading multiple times
 */

module.exports = (function()
{
    var EmailTemplates = {};

    EmailTemplates[EmailType.UserWelcome] =
    {
        html:	fs.readFileSync("server/modules/email/templates/registering-success.html").toString()
    };

    EmailTemplates[EmailType.AccountActivation] =
    {
        html:	fs.readFileSync("server/modules/email/templates/account-activation.html").toString()
    };

    EmailTemplates[EmailType.UserForgetPassword] =
    {
        html:	fs.readFileSync("server/modules/email/templates/forget-password.html").toString()
    };

    EmailTemplates[EmailType.UserPasswordReset] =
    {
        html:	fs.readFileSync("server/modules/email/templates/password-reset-success.html").toString()
    };

    return EmailTemplates;
})();

