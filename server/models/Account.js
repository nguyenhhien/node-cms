module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Account", {
        email: DataTypes.STRING,
        name: DataTypes.STRING,
        password: DataTypes.STRING,
        lastLogin: DataTypes.DATE,
        address: DataTypes.STRING
    },
    {
        freezeTableName: true
    })
}