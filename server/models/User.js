module.exports = function(sequelize, DataTypes) {
     var User = sequelize.define("User", {
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
        emailSubscribe: { type: DataTypes.BOOLEAN, defaultValue: true},
        fbId: DataTypes.STRING,
        googleId: DataTypes.STRING
    },
    {
        freezeTableName: true,
        classMethods: {

        },
        instanceMethods: {

        }
    })

    return User;
}