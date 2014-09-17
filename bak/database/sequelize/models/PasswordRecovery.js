module.exports = function(sequelize, DataTypes) {
    var PasswordRecovery =sequelize.define("PasswordRecovery", {
            passwordResetKey: DataTypes.STRING,
            expiryDate: DataTypes.DATE
        },
        {
            freezeTableName: true,
            classMethods: {
                //relationship with other tables
                associate: function(models) {
                    PasswordRecovery.belongsTo(models.User, {foreignKey: 'userId', foreignKeyConstraint: true})
                }
            },
            instanceMethods: {

            }
        })

    return PasswordRecovery;
}