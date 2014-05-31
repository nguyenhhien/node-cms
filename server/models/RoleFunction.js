module.exports = function(sequelize, DataTypes) {
    var RoleFunction = sequelize.define("RoleFunction", {
            allowCreate: DataTypes.INTEGER,
            allowDelete: DataTypes.INTEGER,
            allowUpdate: DataTypes.INTEGER,
            allowView: DataTypes.INTEGER
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    RoleFunction.belongsTo(models.Role, {foreignKey: 'roleID'});
                    RoleFunction.hasOne(models.Function, {foreignKey: 'roleFunctionID'});
                }
            },
            instanceMethods: {

            }
        })

    return RoleFunction;
}