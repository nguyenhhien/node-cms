module.exports = function(grunt, gruntAppList) {
    var settingObj = {};

    //create concat tasks for each apps
    gruntAppList.forEach(function(elem){
        var prefix = elem.prefix;

        var obj = {};

        obj[elem.app_name] = {
            options: {
                //banner: '<%= meta.banner %>'
            },
            files: {
            }
        };

        obj[elem.app_name].files['<%= concat.'+ prefix + 'js.dest %>'] = '<%= concat.'+ prefix + 'js.dest %>';

        settingObj = grunt.util._.extend(settingObj, obj);
    });

    grunt.config.set('uglify', settingObj);

    grunt.loadNpmTasks('grunt-contrib-uglify');
};