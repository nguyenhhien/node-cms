module.exports = function(grunt, gruntAppList) {
    var settingObj = {
        gruntfile: [
            'Gruntfile.js'
        ],
        options: {
            curly: true,
            immed: true,
            newcap: true,
            noarg: true,
            sub: true,
            boss: true,
            eqnull: true,
            loopfunc:true
        },
        globals: {}
    };

    //create concat tasks for each apps
    gruntAppList.forEach(function(elem){
        var prefix = elem.prefix;

        var srcFiles = [], testFiles = [];
        srcFiles.push('<%= ' + prefix + 'app_files.js %>');
        testFiles.push('<%= ' + prefix + 'app_files.jsunit %>');

        settingObj[prefix + 'src'] = srcFiles;
        settingObj[prefix + 'test'] = testFiles;
    });

    grunt.config.set('jshint', settingObj);

    grunt.loadNpmTasks('grunt-contrib-jshint');
};