module.exports = function(sequelize, DataTypes) {
    var Project = sequelize.define("Project", {
            name: DataTypes.STRING,
            status: DataTypes.INTEGER,
            dueDate: DataTypes.DATE,
            description: DataTypes.TEXT
        },
        {
            freezeTableName: true,
            classMethods: {
                associate: function(models) {
                    Project.hasMany(models.Task, {as: 'Task'})
                }
            },
            instanceMethods: {

            }
        })

    return Project;
}