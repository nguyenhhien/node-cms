'use strict';

//module to send email, etc....
(function(module) {
    var nodemailer          = require("nodemailer");
    var Q                   = require("q");
    var fs                  = require("fs");
    var beaver              = require("../../Beaver.js");
    var mandrill            = require('mandrill-api/mandrill');

    //create mandrill client
    var mandrillClient      = new mandrill.Mandrill(beaver.config.thirdparty.Mandrill.apiKey);

    //load email templates
    var EmailTemplates = {};

    EmailTemplates[EmailType.UserWelcome] =
    {
        html:	fs.readFileSync("server/assets/email/registering-success.html").toString()
    };

    EmailTemplates[EmailType.AccountActivation] =
    {
        html:	fs.readFileSync("server/assets/email/account-activation.html").toString()
    };

    EmailTemplates[EmailType.UserForgetPassword] =
    {
        html:	fs.readFileSync("server/assets/email/forget-password.html").toString()
    };

    EmailTemplates[EmailType.UserPasswordReset] =
    {
        html:	fs.readFileSync("server/assets/email/password-reset-success.html").toString()
    };

    //send email using Mandrill
    module.sendEmail = function(recipients, params)
    {
        //mandrill accept recipient in array format
        if (!(recipients instanceof Array))
        {
            recipients = [recipients];
        }

        recipients = recipients.map(function(elem){
            return {
                email: elem,
                name: elem
            }
        });

        var message = {
            "text": params.text || params.html,
            "html": params.html || params.text,
            "subject": params.title,
            "from_email": beaver.config.global.adminEmail,
            "from_name": 'Beaver.Js',
            "to": recipients,
            "headers": {
                "Reply-To": beaver.config.global.adminEmail
            },
            "important": false,
            "track_opens": null,
            "track_clicks": null,
            "auto_text": null,
            "auto_html": null,
            "inline_css": null,
            "url_strip_qs": null,
            "preserve_recipients": null,
            "bcc_address": null,
            "tracking_domain": null,
            "signing_domain": null,
            "merge": true,
            "global_merge_vars": [],
            "merge_vars": [],
            "tags": [],
            "google_analytics_domains": [],
            "google_analytics_campaign": null,
            "metadata": null,
            "recipient_metadata": [],
            "attachments": [],
            "images": []
        };

        var async = false;
        var ip_pool = null;
        var send_at = null;

        var deferred = Q.defer();

        mandrillClient.messages.send({
                "message": message, "async": async, "ip_pool": ip_pool, "send_at": send_at
            },
            function(result) {
                deferred.resolve(result);
            }, function(e) {
                deferred.reject('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            });


        return deferred.promise;
    }

    //getEmailTemplate -- inject params to replace the placeholder inside templates
    module.getEmailTemplate = function(htmlContent, params)
    {
        htmlContent = htmlContent.replace(/\{appName\}/g, params.appName || beaver.config.global.appName);
        if(params.userName) htmlContent = htmlContent.replace(/\{userName\}/g, params.userName);
        if(params.passwordRecoveryUrl) htmlContent = htmlContent.replace(/\{passwordRecoveryUrl\}/g, params.passwordRecoveryUrl);
        if(params.activationUrl) htmlContent = htmlContent.replace(/\{activationUrl\}/g, params.activationUrl);

        return htmlContent;
    }

    module.sendTemplateEmail = function(templateType, recipients, templateParams)
    {
        var emailParams = {};

        switch(templateType)
        {
            case EmailType.UserWelcome:
                emailParams.subject = "Welcome To " + beaver.config.global.appName;
                emailParams.html = this.getEmailTemplate(EmailTemplates[EmailType.UserWelcome].html, templateParams);
                break;

            case EmailType.AccountActivation:
                emailParams.subject = "Account Activation";
                emailParams.html = this.getEmailTemplate(EmailTemplates[EmailType.AccountActivation].html, templateParams);
                break;

            case EmailType.UserForgetPassword:
                emailParams.subject = "Password Reset";
                emailParams.html = this.getEmailTemplate(EmailTemplates[EmailType.UserForgetPassword].html, templateParams);
                break;

            case EmailType.UserPasswordReset:
                emailParams.subject = "Password Reset Successful";
                emailParams.html = this.getEmailTemplate(EmailTemplates[EmailType.UserPasswordReset].html, templateParams);
                break;

            default:
                break;
        }

        //send email using smtp method
        return module.sendEmail(recipients, emailParams);
    }
}(exports));