module.exports = function(sequelize, DataTypes) {
    var LocationType = sequelize.define("LocationType", {
            name: DataTypes.STRING
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    LocationType.hasOne(LocationType, {as: 'Parent', foreignKey: 'parentId'});
                    LocationType.hasMany(LocationType, {as: 'Children', foreignKey: 'parentId', through: null })
                    LocationType.hasMany(models.Location, {foreignKey: 'locationTypeId'});
                }
            },
            instanceMethods: {

            }
        })

    return LocationType;
}