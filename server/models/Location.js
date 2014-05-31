module.exports = function(sequelize, DataTypes) {
    var Location = sequelize.define("Location", {
            name: DataTypes.STRING
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    Location.hasOne(Location, {as: 'Parent', foreignKey: 'parentID'});
                    Location.hasMany(Location, {as: 'Children', foreignKey: 'parentID', through: null });
                    Location.hasOne(models.LocationType, {as: 'LocationType', foreignKey: 'locationID'});

                    //many-many relationship with position
                    Location.hasMany(models.Position, {through: 'PositionLocation', foreignKey: 'locationID'})
                }
            },
            instanceMethods: {

            }
        })

    return Location;
}