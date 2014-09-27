module.exports = function(grunt, gruntAppList) {
    var settingObj = {};

    //create concat tasks for each apps
    var srcFiles = [], testFiles = [];
    gruntAppList.forEach(function(elem){
        var prefix = elem.prefix;

        srcFiles.push('<%= ' + prefix + 'app_files.js %>');
        testFiles.push('<%= ' + prefix + 'app_files.jsunit %>');
    });

    grunt.config.set('jshint',{
        src: srcFiles,
        test: testFiles,
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
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
};