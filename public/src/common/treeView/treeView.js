var app = angular.module( 'common.treeView', [
    'utils',
    'localytics.directives',
    'ui.bootstrap',
    'mgcrea.ngStrap',
    'ngResource',
    'utils'
]);


app.directive('treeView', ["$rootScope", "$resource", "utils", function($rootScope, $resource, utils)
{
    return {
        scope: {
            objectName: "=",
            visibleLevel: "="
        },
        templateUrl: "treeView/treeView.tpl.html",
        link: function (scope, element, attr)
        {
            var visibleLevel = scope.visibleLevel || 3;

            var ObjectResource = $resource('/api/locations/:id', {id: '@_id'}, {
                query:{
                    isArray:true, method:'GET'
                }
            });

            var childMap = {};
            var nodeMap = {};

            ObjectResource.query()
                .$promise
                .then(function(response){
                    scope.rootNodes = scope.rootNodes || [];

                    _.forEach(response, function(node){
                        nodeMap[node.id] = node;

                        if(node.parentId)
                        {
                            childMap[node.parentId] = childMap[node.parentId] || [];
                            childMap[node.parentId].push(node);
                        }
                        else
                        {
                            scope.rootNodes.push(node);
                        }
                    });

                    //recursive initialize replies
                    function initReplyRecursive(rootNodes)
                    {
                        if(!rootNodes || !rootNodes.length){
                            return;
                        }

                        _.forEach(rootNodes, function(node){
                            node.childNodes = childMap[node.id];

                            if(node.level <= visibleLevel)
                            {
                                node.nodeOpen = true;
                            }
                            else
                            {
                                node.nodeOpen = false;
                            }

                            initReplyRecursive(node.childNodes);
                        });
                    }

                    //init rootNodes recursive
                    //by default, rootNodes is open
                    initReplyRecursive(scope.rootNodes);
                    console.log(scope.rootNodes);
                });

            //toggle child node visibility
            scope.toggleChildNode = function(node)
            {
                node.nodeOpen = !node.nodeOpen;
            };

            scope.selectTreeNode = function(node)
            {
                scope.selectedTreeNode = node;
            };
        }
    };

}]);