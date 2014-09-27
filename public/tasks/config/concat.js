//concat list of files -- and save to destination folder
module.exports = function(grunt, gruntAppList) {
    var settingObj = {};

    //create concat tasks for each apps
    gruntAppList.forEach(function(elem){
        var prefix = elem.prefix;

        var obj = {};

        //TODO: check if we need to copy to compile dir -- for now,
        //TODO: it seems to be ok cause we include vendor files directly into less -- but not performance wise
        obj[(prefix + "css")] = {
            src: [
                '<%= ' + prefix + 'vendor_files.css %>',
                '<%= less.' + prefix + 'build.dest %>'
            ],
            dest: '<%= less.' + prefix + 'build.dest %>'
        };

        //this is for distribution cause in dev-mode, we only copy js files
        obj[(prefix + "js")] = {
            options: {
                //banner: '<%= meta.banner %>'
            },
            //vendor files + files under cms (modules angular route files) + common templates
            src: [
                '<%= ' + prefix + 'vendor_files.js %>',
                'module.prefix',
                '<%= ' + prefix + 'build_dir %>/' + elem.app_name + '/**/*.js',
                '<%= ' + prefix + 'build_dir %>/common/**/*.js',
                '<%= html2js.'+(prefix + "main")+'.dest %>',
                '<%= html2js.'+(prefix + "common")+'.dest %>',
                'module.suffix'
            ],
            dest: '<%= ' + prefix + 'compile_dir %>/assets/<%= pkg.name %>-' + prefix + '<%= pkg.version %>.js'
        };

        settingObj = grunt.util._.extend(settingObj, obj);
    });

    grunt.config.set('concat', settingObj);

    grunt.loadNpmTasks('grunt-contrib-concat');
};
