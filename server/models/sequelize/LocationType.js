module.exports = function(sequelize, DataTypes) {
    var LocationType = sequelize.define("LocationType", {
            name: DataTypes.STRING
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    LocationType.hasOne(LocationType, {as: 'Parent', foreignKey: 'ParentId'});
                    LocationType.hasMany(LocationType, {as: 'Children', foreignKey: 'ParentId', through: null })
                    LocationType.hasMany(models.Location);
                }
            },
            instanceMethods: {

            }
        })

    return LocationType;
}