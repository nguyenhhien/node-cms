module.exports = function ( grunt ) {
    require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});
    require('time-grunt')(grunt);

    //load config files
    var userConfig = require( './build.config.js' );

    //grunt tasks
    var gruntTasks = require("./tasks");

    //load config tasks into grunt
    Object.keys(gruntTasks.config || []).forEach(function(key){
        var configTask = gruntTasks.config[key];
        configTask(grunt);
    });

    //load register tasks into grunt
    Object.keys(gruntTasks.register || []).forEach(function(key){
        var registerTask = gruntTasks.config[key];
        registerTask(grunt);
    });

    //load all grunt tasks
    grunt.registerTask('test', function(){
        console.log("grunt tasks", gruntTasks);
    })
};
