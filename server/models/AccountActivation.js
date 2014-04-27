module.exports = function(sequelize, DataTypes) {
    return sequelize.define("AccountActivation", {
        activationKey: DataTypes.STRING,
        expiryDate: DataTypes.DATE,
        accountId: {
            type: DataTypes.INTEGER,
            references: "Account",
            referencesKey: "id"
        }
    },
    {
        freezeTableName: true
    })
}