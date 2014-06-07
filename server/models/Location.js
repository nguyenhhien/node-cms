module.exports = function(sequelize, DataTypes) {
    var Location = sequelize.define("Location", {
            name: DataTypes.STRING
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
                }
            },
            instanceMethods: {

            }
        })

    return Location;
}