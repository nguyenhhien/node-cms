module.exports = function(grunt, userConfig) {
    grunt.config.set('jshint',{
        src: [
            '<%= cms_files.js %>',
            '<%= login_files.js %>'
        ],
        test: [
            '<%= cms_files.jsunit %>'
        ],
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