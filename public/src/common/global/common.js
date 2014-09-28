function safeApply (scope, expr)
{
    scope = scope || $rootScope;
    if (['$apply', '$digest'].indexOf(scope.$root.$$phase) !== -1) {
        try {
            return scope.$eval(expr);
        } catch (e) {
            console.error("Exception when executing safeApply", e.stack || e);
        }
    } else {
        return scope.$apply(expr);
    }
}

//using jquery growl for now
//TODO: we should open the popup model incase of error
function showError(msg)
{
    $.growl.error({ message: msg});
}

//show success msg
function showSuccess(msg)
{
    $.growl.notice({title: 'Success', message: msg });
}

//show info message
function showMessage(title, msg)
{
    $.growl({ title: title, message: msg});
}