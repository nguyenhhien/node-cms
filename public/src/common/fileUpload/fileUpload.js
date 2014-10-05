var app = angular.module('common.fileUpload', []);

function checkFileTypes(files, filter)
{
    if (!files) {
        return true;
    }

    var re = new RegExp(".("+filter+")$");
    for (var i=0; i<files.length; i++)
    {
        if (!files[i].name.toLowerCase().match(re))
        {
            console.error("Only following file types are supported: "+filter.split("|").join(", "));
            return false;
        }
    }
    return true;
}

//simple file upload directive using jquery file upload
app.directive('beaverFileUpload', ["$rootScope", "$resource", '$timeout', function($rootScope, $resource, $timeout)
{
    return {
        scope: {
            uploadUrl: "@",
            uploadDone: "&",
            formData: "=",
            filters: "@"
        },
        link: function (scope, element, attr)
        {
            var filters = scope.filters;

            element.find("input[type=file]").fileupload(
                {
                    type: 				"POST",
                    dataType: 			"JSON",
                    url: 				scope.uploadUrl,
                    singleFileUploads: 	true,
                    dropZone: null,
                    pasteZone: null,

                    submit: function(e, data)
                    {
                    },

                    done: function(e, data)
                    {
                        var res = data.result;

                        if (res.error) {
                            scope.$apply(function ()
                            {
                                scope.loading = false;
                            });

                            return showError(res.error);
                        }

                        scope.$apply(function ()
                        {
                            scope.loading=false;
                        });

                        console.log("upload response", res);

                        // $timeout is necessary to let things digest first before firing change event
                        $timeout(function ()
                        {
                            scope.uploadDone({res: res});
                        }, 500);
                    },

                    add: function(e, data)
                    {
                        if (!data.files.length) {
                            return;
                        }

                        // check format compliance
                        if (!checkFileTypes(data.files, filters)) {
                            showError("Only the following files are allowed. " +
                                filters.split("|").join(", ").toUpperCase());
                        }
                        else
                        {
                            data.submit();

                            scope.$apply(function ()
                            {
                                scope.loading=true;
                            });
                        }
                    },

                    fail: function(e, data)
                    {
                        showError("Error while uploading file to server: ", data.errorThrown);
                    }
                })
                .on("fileuploadsubmit", function(e, data)
                {
                    data.formData = scope.formData;
                });
        }
    };
}]);