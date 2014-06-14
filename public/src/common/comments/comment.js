var app = angular.module( 'common.commentThread', [
    'classy',
    'utils',
    'localytics.directives',
    'ui.bootstrap',
    'mgcrea.ngStrap',
    'ngResource',
    'utils'
]);

app.directive('commentThreadBlock', ["$rootScope", "$resource", "utils", function($rootScope, $resource, utils)
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

            var childMap = {}; //map all child comments of comment_id
            var commentMap = {}; //map comment_id -> comment

            //load all comments
            Comments.query({
                discussionId: scope.discussionId,
                discussionName: scope.discussionName,
                limit: 100, offset: 0
            }).$promise.then(function(response){
                    scope.comments = scope.comments || [];

                    _.forEach(response, function(comment){
                        commentMap[comment._id] = comment;

                        if(comment.parentId)
                        {
                            childMap[comment.parentId] = childMap[comment.parentId] || [];
                            childMap[comment.parentId].push(comment);
                        }
                        else
                        {
                            scope.comments.push(comment);
                        }
                    });

                    //recursive initialize replies
                    function initReplyRecursive(comments)
                    {
                        if(!comments || !comments.length){
                            return;
                        }

                        _.forEach(comments, function(comment){
                            comment.replies = childMap[comment._id];

                            initReplyRecursive(comment.replies);
                        });
                    }

                    //init comments recursive
                    initReplyRecursive(scope.comments);
                });

            scope.newComment = angular.extend(new Comments(), {
                discussionId: scope.discussionId,
                discussionName: scope.discussionName
            });

            //toggle add reply panel
            scope.toggleReplyPanel = function(comment)
            {
                comment.dataAddReplyPanel=!comment.dataAddReplyPanel;

                if(comment.dataAddReplyPanel)
                {
                    if(!comment.newReply)
                    {
                        comment.newReply = angular.extend(new Comments(), {
                            discussionId: scope.discussionId,
                            discussionName: scope.discussionName,
                            parent: _.pick(comment, ["_id", "slug", "fullSlug"])
                        });
                    }
                }
            };

            //add reply
            scope.addReply = function(reply)
            {
                var parentId = reply.parent && reply.parent._id;
                
                reply.$save()
                    .then(function(response){
                        if(!response.error)
                        {
                            //copy to comment map
                            commentMap[response._id] = response;
                            
                            if(!parentId)
                            {
                                utils.$safeApply(scope, function(){
                                    scope.comments.push(response);

                                    scope.newComment = angular.extend(new Comments(), {
                                        discussionId: scope.discussionId,
                                        discussionName: scope.discussionName
                                    });
                                });
                            }      
                            else
                            {
                                var parentComment = commentMap[parentId];
                                if(!childMap[parentComment._id])
                                {
                                    childMap[parentComment._id] = [];
                                    parentComment.replies = childMap[parentComment._id];
                                }

                                childMap[parentComment._id].push(response);
                                
                                utils.$safeApply(scope, function(){
                                    parentComment.replies = ( parentComment.replies || []);
                                    //parentComment.replies.push(response); //no need; because parent.replies = childMap (already updated)

                                    parentComment.newReply = angular.extend(new Comments(), {
                                        discussionId: scope.discussionId,
                                        discussionName: scope.discussionName,
                                        parent: _.pick(parentComment, ["_id", "slug", "fullSlug"])
                                    });
                                });    
                            }
                        }
                    });
            };

            //remove reply
            scope.removeReply = function(reply)
            {
                (angular.copy(reply)).$delete({id: reply._id})
                    .then(function(response){
                        if(!response.error)
                        {
                            utils.$safeApply(scope, function(){
                                //remove from maps
                                delete commentMap[reply._id];
                                if(reply.parentId)
                                {
                                    _.remove(childMap[reply.parentId], function(elem){return elem._id == reply._id;});
                                }
                                else
                                {
                                    //remove delete results
                                    _.remove(scope.comments, function(elem){return elem._id == reply._id;});
                                }
                            });
                        }
                    });
            };
        }
    };
}]);


