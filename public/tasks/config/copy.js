module.exports = function(grunt, gruntAppList) {
    var settingObj = {};

    //create concat tasks for each apps
    gruntAppList.forEach(function(elem){
        var prefix = elem.prefix;

        var obj = {};

        //assets copy tasks can be shared between modules
        obj["build_assets"] = {
            files: [
                {
                    src: [ '**' ],
                    dest: '<%= ' + prefix + 'build_dir %>/assets/',
                    cwd: 'src/assets',
                    expand: true
                }
            ]
        };

        obj["compile_assets"] = {
            files: [
                {
                    src: [ '**' ],
                    dest: '<%= ' + prefix + 'compile_dir %>/assets/',
                    cwd: '<%= ' + prefix+ 'build_dir %>/assets',
                    expand: true
                }
            ]
        };


        obj[(prefix + "app_js")] = {
            files: [
                {
                    src: [ '<%= ' + prefix + 'app_files.js %>' ],
                    dest: '<%= ' + prefix + 'build_dir %>/',
                    cwd: '.',
                    expand: true
                }
            ]
        };

        obj[(prefix + "vendor_js")] = {
            files: [
                {
                    src: [ '<%= ' + prefix + 'vendor_files.js %>' ],
                    dest: '<%= ' + prefix + 'build_dir %>/',
                    cwd: '.',
                    expand: true
                }
            ]
        };

        settingObj = grunt.util._.extend(settingObj, obj);
    });

    grunt.config.set('copy', settingObj);

    grunt.loadNpmTasks('grunt-contrib-copy');
};