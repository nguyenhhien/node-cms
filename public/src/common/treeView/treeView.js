var app = angular.module( 'common.treeView', [
    'utils',
    'localytics.directives',
    'ui.bootstrap',
    'ngResource',
    'utils'
]);


app.directive('treeView', ["$rootScope", "$resource", "utils", function($rootScope, $resource, utils)
{
    return {
        scope: {
            objectName: "@",
            visibleLevel: "@",
            initNodeId: "@",
            selectedTreeNode: "="
        },
        templateUrl: "treeView/treeView.tpl.html",
        link: function (scope, element, attr)
        {
            var visibleLevel = parseInt(scope.visibleLevel) || 3;

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

                    //initialize selected treenode
                    if(scope.initNodeId)
                    {
                        scope.initNodeId = parseInt(scope.initNodeId);
                        scope.selectedTreeNode = nodeMap[scope.initNodeId];
                        scope.selectedTreeNode.manualUserSelect = false;
                        console.log("update node selected with id ", scope.initNodeId);
                    }

                    scope.$watch('initNodeId', function(nodeId){
                        if(nodeId)
                        {
                            nodeId = parseInt(nodeId);
                            scope.selectedTreeNode = nodeMap[nodeId];
                            scope.selectedTreeNode.manualUserSelect = false;
                            console.log("update selected with id ", nodeId);
                        }
                    });

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
                scope.selectedTreeNode.manualUserSelect = true;
            };
        }
    };

}]);