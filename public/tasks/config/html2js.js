//compile html to js
module.exports = function(grunt, gruntAppList) {
    var settingObj = {};

    //create clean tasks for each apps
    gruntAppList.forEach(function(elem){
        var prefix = elem.prefix;

        var obj = {};
        obj[(prefix + "main")] = {
            options: {
                base: 'src/' + elem.app_name
            },
            src: [ '<%= ' + prefix + 'app_files.atpl %>' ],
            dest: '<%= ' + prefix + 'build_dir %>/' + prefix + 'templates-app.js'
        };

        //templates inside common folder
        obj[(prefix + "common")] = {
            options: {
                base: 'src/common'
            },
            src: [ '<%= ' + prefix + 'app_files.ctpl %>' ],
            dest: '<%= ' + prefix + 'build_dir %>/' + prefix + 'templates-common.js'
        };

        settingObj = grunt.util._.extend(settingObj, obj);
    });

    grunt.config.set('html2js', settingObj);

    grunt.loadNpmTasks('grunt-html2js');
};
