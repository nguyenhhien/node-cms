module.exports = function(sequelize, DataTypes) {
    return sequelize.define("AccountActivation", {
        activationKey: DataTypes.STRING,
        AccountId: {
            type: DataTypes.INTEGER,
            references: "Account",
            referencesKey: "id"
        }
    },
    {
        freezeTableName: true
    })
}