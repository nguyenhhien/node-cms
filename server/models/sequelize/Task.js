module.exports = function(sequelize, DataTypes) {
    var Task = sequelize.define("Task", {
            name: DataTypes.STRING,
            status: DataTypes.INTEGER,
            priority: DataTypes.INTEGER,
            dueDate: DataTypes.DATE,
            resolveDate: DataTypes.DATE,
            description: DataTypes.TEXT
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    //belongto: foreign key ownerId will be added to Task table
                    Task.belongsTo(models.User, {foreignKey: 'OwnerId', foreignKeyConstraint: true});
                    Task.belongsTo(models.User, {foreignKey: 'AssigneeId', foreignKeyConstraint: true});
                    Task.belongsTo(models.Project, {foreignKeyConstraint: true});
                    Task.hasMany(models.User);
                }
            },
            instanceMethods: {

            }
        })

    return Task;
}