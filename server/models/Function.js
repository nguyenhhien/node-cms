module.exports = function(sequelize, DataTypes) {
    var Function = sequelize.define("Function", {
            name: DataTypes.STRING
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    Function.hasMany(models.RoleFunction, {foreignKey: 'functionID'});
                }
            },
            instanceMethods: {

            }
        })

    return Function;
}