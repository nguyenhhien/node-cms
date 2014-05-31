module.exports = function(sequelize, DataTypes) {
    var Role = sequelize.define("Role", {
            name: DataTypes.STRING,
            code: DataTypes.STRING
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    Role.hasMany(models.Position, {foreignKey: 'roleID'});
                    Role.hasMany(models.RoleFunction, {foreignKey: 'roleID'});
                }
            },
            instanceMethods: {

            }
        })

    return Role;
}