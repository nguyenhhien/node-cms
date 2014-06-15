var Q                   = require("q");

//Support AdjacentList + Nested Set Model + Hirachical Path
module.exports = function(sequelize, DataTypes) {
    var Location = sequelize.define("Location", {
            name: DataTypes.STRING,
            left: DataTypes.INTEGER,
            right: DataTypes.INTEGER,
            level: DataTypes.INTEGER,
            path: DataTypes.STRING
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    Location.hasOne(Location, {as: 'Parent', foreignKey: 'parentId'});
                    Location.hasMany(Location, {as: 'Children', foreignKey: 'parentId', through: null });
                    Location.hasOne(models.LocationType, {as: 'LocationType', foreignKey: 'locationId'});

                    //many-many relationship with position
                    Location.hasMany(models.Position, {through: 'PositionLocation', foreignKey: 'locationId'})
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
                                //insert node as right-most child node of certain parent node
                                if(parent){
                                    parentRight = parent.right;
                                    parentLeft = parent.left;
                                    parentLevel = parent.level;
                                    parentId = parent.id;

                                    //update other affected node
                                    var query = "UPDATE Location SET left = CASE WHEN left > ? THEN left + 2 ELSE left END, " +
                                        "right= CASE WHEN right > ? THEN right + 2 ELSE right END WHERE right > ?";

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
                                    left: parentRight,
                                    right: parentRight+1,
                                    level: parentLevel+1,
                                    parentId: parent.id
                                }, {transaction:t}));
                            })
                            .then(function(newLocation){
                                t.commit().success(function() {
                                    console.log("Transaction is commit");
                                    return Q.resolve(newLocation);
                                });
                            })
                            .fail(function(err){
                                //fail somewhere -- need to roolback
                                t.rollback().success(function() {
                                    console.log("Transaction is rollback because " + err);
                                    return Q.reject(err);
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
                                    nodeLeft = treeNode.left;
                                    nodeRight = treeNode.right;
                                    nodeWidth = (nodeRight - nodeLeft + 1);

                                    //delete child node
                                    var query = "DELETE FROM Location WHERE left BETWEEN ? AND ?";

                                    return sequelize.query(query, null, {raw: true, transaction: t}, [nodeLeft, nodeRight]);
                                }
                                else
                                {
                                    return Q.reject("Location Node with Id = " + nodeId + " not found");
                                }
                            })
                            .then(function(){
                                //run update other node
                                var query = "UPDATE Location SET right = right - ? WHERE right > ?";

                                return sequelize.query(query, null, {raw: true, transaction: t}, [nodeWidth, nodeRight]);
                            })
                            .then(function(){
                                //run update other node
                                var query = "UPDATE Location SET left = left - ? WHERE left > ?";

                                return sequelize.query(query, null, {raw: true, transaction: t}, [nodeWidth, nodeRight]);
                            })
                            .then(function(){
                                t.commit().success(function() {
                                    console.log("Transaction is commit");
                                    return Q.resolve();
                                });
                            })
                            .fail(function(err){
                                //fail somewhere -- need to roolback
                                t.rollback().success(function() {
                                    console.log("Transaction is rollback because " + err);
                                    return Q.reject(err);
                                });
                            });

                        //will execute after commit or rollback. can be used for any final cleanup
                        t.done(function(){
                            console.log("transaction to delete tree node done");
                        });
                    });

                    return deferred.promise;
                }
            },
            instanceMethods: {

            }
        })

    return Location;
}