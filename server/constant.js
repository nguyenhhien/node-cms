ResponseCode = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    UNSUPPORTED_ACTION: 405,
    VALIDATION_FAILED: 422,
    SERVER_ERROR: 500
};

UserStatus =
{
    Active: 0,
    Suspended: 1,
    Inactive: 2								// account must be activated first
}

EmailType =
{
    UserWelcome:    			    0,
    AccountActivation: 			    1,
    UserForgetPassword: 			2,
    UserPasswordReset: 				3
}

Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + days);
    return this;
};