var app = angular.module( 'common.commentThread', [
    'classy',
    'utils',
    'localytics.directives',
    'ui.bootstrap',
    'mgcrea.ngStrap',
    'ngResource'
]);

app.directive('commentThreadBlock', ["$rootScope", "$resource", function($rootScope, $resource)
{
    return {
        scope: {
            discussionId: "=",
            discussionName: "=",
            pageSize: "="
        },
        templateUrl: "comments/comment.tpl.html",
        link: function (scope, element, attr)
        {
            //transform pagination
            var Comments = $resource('/api/comments/:id', {id: '@_id'}, {
                query:{
                    isArray:true, method:'GET',
                    transformResponse: function (data, headers) {
                        return JSON.parse(data).rows;
                    }
                }
            });

            //load all comments
            Comments.query({
                discussionId: scope.discussionId,
                discussionName: scope.discussionName,
                limit: 100, offset: 0
            }).$promise.then(function(response){
                    scope.comments = response;
                    scope.comments[0].nodes = [angular.copy(scope.comments[0])];
                    scope.comments[0].nodes[0].nodes = [angular.copy(scope.comments[0])];
                });

            scope.newComment = {
                discussionId: scope.discussionId,
                discussionName: scope.discussionName
            };

            //add reply
            scope.addReply = function(reply)
            {
                if(!reply)
                {
                    //add comments into the root thread
                }
            };
        }
    };
}]);


