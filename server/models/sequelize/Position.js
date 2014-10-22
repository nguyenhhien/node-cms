module.exports = function(sequelize, DataTypes) {
    var Position = sequelize.define("Position", {
            name: DataTypes.STRING
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    Position.belongsTo(models.Role);

                    //many to many with location
                    Position.hasMany(models.Location);
                }
            },
            instanceMethods: {

            }
        })

    return Position;
}