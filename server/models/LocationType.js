module.exports = function(sequelize, DataTypes) {
    var LocationType = sequelize.define("LocationType", {
            name: DataTypes.STRING
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    LocationType.hasOne(LocationType, {as: 'Parent', foreignKey: 'parentID'});
                    LocationType.hasMany(LocationType, {as: 'Children', foreignKey: 'parentID', through: null })
                    LocationType.hasMany(models.Location, {foreignKey: 'locationTypeID'});
                }
            },
            instanceMethods: {

            }
        })

    return LocationType;
}