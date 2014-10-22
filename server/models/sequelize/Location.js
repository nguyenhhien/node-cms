var Q                   = require("q");

//Support AdjacentList + Nested Set Model + Hirachical Path
module.exports = function(sequelize, DataTypes) {
    var Location = sequelize.define("Location", {
            name: DataTypes.STRING,
            lft: DataTypes.INTEGER,
            rgt: DataTypes.INTEGER,
            level: DataTypes.INTEGER,
            path: DataTypes.STRING
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    Location.hasOne(Location, {as: 'Parent', foreignKey: 'ParentId'});
                    Location.hasMany(Location, {as: 'Children', foreignKey: 'ParentId', through: null });
                    Location.hasOne(models.LocationType);

                    //many-many relationship with position
                    Location.hasMany(models.Position);
                },
                addTreeNode: function(parentId, treeNode)
                {
                    //TODO: Adding Table LOCK to ensure concurrency
                    //assume that tree must have at least one node at beginning
                    var parentRight, parentLevel, parentLeft, parentId;

                    var deferred = Q.defer();

                    //initialize transaction to ensure ACID update
                    sequelize.transaction(function(t) {
                        Q(Location.find({where: {id: parentId} },{ transaction: t}))
                            .then(function(parent){
                                //insert node as rgt-most child node of certain parent node
                                if(parent){
                                    parentRight = parent.rgt;
                                    parentLeft = parent.lft;
                                    parentLevel = parent.level;
                                    parentId = parent.id;

                                    //update other affected node
                                    var query = "UPDATE Location SET lft = CASE WHEN lft > ? THEN lft + 2 ELSE lft END, " +
                                        "rgt= CASE WHEN rgt >= ? THEN rgt + 2 ELSE rgt END WHERE rgt >= ?";

                                    return sequelize.query(query, null, {raw: true, transaction: t}, [parentRight, parentRight, parentRight]);
                                }
                                else
                                {
                                    return Q.reject("Parent with Id = " + parentId + " not found");
                                }
                            })
                            .then(function(){
                                //insert the current node
                                return Q(Location.create({
                                    name: treeNode.name,
                                    lft: parentRight,
                                    rgt: parentRight+1,
                                    level: parentLevel+1,
                                    ParentId: parentId
                                }, {transaction:t}));
                            })
                            .then(function(newLocation){
                                t.commit().success(function() {
                                    console.log("Transaction is commit");
                                    return deferred.resolve(newLocation);
                                });
                            })
                            .fail(function(err){
                                //fail somewhere -- need to roolback
                                t.rollback().success(function() {
                                    console.log("Transaction is rollback because " + err);
                                    return deferred.reject(err);
                                });
                            });

                        //will execute after commit or rollback. can be used for any final cleanup
                        t.done(function(){
                            console.log("transaction to add tree node done");
                        });
                    });

                    return deferred.promise;
                },
                removeTreeNode: function(nodeId)
                {
                    //TODO: Adding Table LOCK to ensure concurrency
                    var deferred = Q.defer();

                    var nodeLeft, nodeRight, nodeWidth;

                    sequelize.transaction(function(t) {
                        Q(Location.find({where: {id: nodeId} },{ transaction: t}))
                            .then(function(treeNode){
                                if(treeNode)
                                {
                                    nodeLeft = treeNode.lft;
                                    nodeRight = treeNode.rgt;
                                    nodeWidth = (nodeRight - nodeLeft + 1);

                                    //delete child node
                                    var query = "DELETE FROM Location WHERE lft BETWEEN ? AND ?";

                                    return sequelize.query(query, null, {raw: true, transaction: t}, [nodeLeft, nodeRight]);
                                }
                                else
                                {
                                    return Q.reject("Location Node with Id = " + nodeId + " not found");
                                }
                            })
                            .then(function(){
                                //run update other node
                                var query = "UPDATE Location SET rgt = rgt - ? WHERE rgt > ?";

                                return sequelize.query(query, null, {raw: true, transaction: t}, [nodeWidth, nodeRight]);
                            })
                            .then(function(){
                                //run update other node
                                var query = "UPDATE Location SET lft = lft - ? WHERE lft > ?";

                                return sequelize.query(query, null, {raw: true, transaction: t}, [nodeWidth, nodeRight]);
                            })
                            .then(function(){
                                t.commit().success(function() {
                                    console.log("Transaction is commit");
                                    return deferred.resolve();
                                });
                            })
                            .fail(function(err){
                                //fail somewhere -- need to roolback
                                t.rollback().success(function() {
                                    console.log("Transaction is rollback because " + err);
                                    return deferred.reject(err);
                                });
                            });

                        //will execute after commit or rollback. can be used for any final cleanup
                        t.done(function(){
                            console.log("transaction to delete tree node done");
                        });
                    });

                    return deferred.promise;
                },
                getFullTree: function()
                {
                    //rootnode has left node = 1
                    var query = "SELECT node.* \
                                FROM Location AS node, \
                                Location AS parent \
                                WHERE node.lft BETWEEN parent.lft AND parent.rgt \
                                AND parent.lft = 1 \
                                ORDER BY node.lft";

                    return sequelize.query(query, null, {raw: true}, []);
                }
            },
            instanceMethods: {

            }
        })

    return Location;
}