module.exports = function(sequelize, DataTypes) {
    var UserActivation = sequelize.define("UserActivation", {
        activationKey: DataTypes.STRING,
        expiryDate: DataTypes.DATE
    },
    {
        freezeTableName: true,
        classMethods: {
            associate: function(models) {
                UserActivation.belongsTo(models.User, {foreignKey: 'userId', foreignKeyConstraint: true})
            }
        },
        instanceMethods: {

        }
    })

    return UserActivation;
}