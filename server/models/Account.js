module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Account", {
        email: DataTypes.STRING,
        name: DataTypes.STRING,
        password: DataTypes.STRING,
        lastLogin: DataTypes.DATE,
        address: DataTypes.STRING,
        street: DataTypes.STRING,
        city: DataTypes.STRING,
        country: DataTypes.STRING,
        postalCode: DataTypes.STRING,
        status:  DataTypes.INTEGER,
        fbId: DataTypes.STRING,
        googleId: DataTypes.STRING
    },
    {
        freezeTableName: true
    })
}