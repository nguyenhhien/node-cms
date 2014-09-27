//clean build and compile dir -- remove folder
module.exports = function(grunt, gruntAppList) {
    var settingObj = {};

    //create clean tasks for each apps
    gruntAppList.forEach(function(elem){
        var prefix = elem.prefix;

        var obj = {};
        obj[(prefix + "build")] = [
            '<%= ' + prefix + 'build_dir %>'
        ];

        obj[(prefix + "compile")] = [
            '<%= '+prefix+'compile_dir %>'
        ];

        settingObj = grunt.util._.extend(settingObj, obj);
    });

    grunt.config.set('clean', settingObj);

    grunt.loadNpmTasks('grunt-contrib-clean');
};
