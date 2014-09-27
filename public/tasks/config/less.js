module.exports = function(grunt, gruntAppList) {
    var settingObj = {};

    //create clean tasks for each apps
    gruntAppList.forEach(function(elem){
        var prefix = elem.prefix;

        var obj = {};
        obj[(prefix + "build")] = {
            src: [ '<%= ' + (prefix+'app_files') + '.less %>' ],
            dest: ('<%= ' + (prefix + 'build_dir') + '%>/assets/<%= pkg.name %>_'+prefix+'<%= pkg.version %>.css'),
            options: {
                compile: true,
                compress: false,
                noUnderscores: false,
                noIDs: false,
                zeroUnits: false
            }
        };

        obj[(prefix + "compile")] = {
            src: [ '<%= less.'+(prefix + "build")+'.dest %>' ],
            dest: ('<%= ' + (prefix + 'compile_dir') + '%>/assets/<%= pkg.name %>_'+prefix+'<%= pkg.version %>.css'),
            options: {
                compile: true,
                compress: true,
                noUnderscores: false,
                noIDs: false,
                zeroUnits: false
            }
        };

        settingObj = grunt.util._.extend(settingObj, obj);
    });

    grunt.config.set('less', settingObj);

    grunt.loadNpmTasks('grunt-contrib-less');
};