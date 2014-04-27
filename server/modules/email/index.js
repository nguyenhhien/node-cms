var EmailTemplates      = require("./EmailTemplates.js");
var nodemailer          = require("nodemailer");
var Q                   = require("q");

module.exports = (function()
{
    var transport = nodemailer.createTransport("SMTP", {
        host: "smtp.gmail.com",
        secureConnection: true,
        port: 465,
        auth: {
            user: "epouch.revolution@gmail.com",
            pass: "vo0espbo"
        } });

    this.sendEmail = function(recipients, params)
    {
        var deferred = Q.defer();

        var mailOptions = {
            from: "epouch@support.com",
            to: recipients,
            subject: params.title,
            text: params.text || params.html,
            html: params.html || params.text
        }

        transport.sendMail(mailOptions, function(err){
            transport.close();

            if(err) return deferred.reject(new Error(err));
            return deferred.resolve();
        });

        return deferred.promise;
    }

    //replace email placeholder by real name, etc
    this.buildEmailContent = function(htmlContent, params)
    {
        htmlContent = htmlContent.replace(/\{appName\}/g, params.appName || Config.Global.appName);
        if(params.userName) htmlContent = htmlContent.replace(/\{userName\}/g, params.userName);
        if(params.passwordRecoveryUrl) htmlContent = htmlContent.replace(/\{passwordRecoveryUrl\}/g, params.passwordRecoveryUrl);
        if(params.activationUrl) htmlContent = htmlContent.replace(/\{activationUrl\}/g, params.activationUrl);

        return htmlContent;
    }

    this.sendTemplateEmail = function(templateType, recipients, templateParams)
    {
        var emailParams = {};

        switch(templateType)
        {
            case EmailType.UserWelcome:
                emailParams.subject = "Welcome To " + Config.Global.appName;
                emailParams.html = this.buildEmailContent(EmailTemplates[EmailType.UserWelcome].html, templateParams);
                break;
            case EmailType.AccountActivation:
                emailParams.subject = "Account Activation";
                emailParams.html = this.buildEmailContent(EmailTemplates[EmailType.AccountActivation].html, templateParams);
                break;
            case EmailType.UserForgetPassword:
                emailParams.subject = "Password Reset";
                emailParams.html = this.buildEmailContent(EmailTemplates[EmailType.UserForgetPassword].html, templateParams);
                break;
            case EmailType.UserPasswordReset:
                emailParams.subject = "Password Reset Successful";
                emailParams.html = this.buildEmailContent(EmailTemplates[EmailType.UserPasswordReset].html, templateParams);
                break;

            default:
                break;
        }


        return this.sendEmail(recipients, emailParams);
    }

    return this;
})();