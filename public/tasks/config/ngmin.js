module.exports = function(grunt) {
    grunt.config.set('ngmin', {
        cms: {
            files: [
                {
                    src: [ '<%= cms_files.js %>' ],
                    cwd: '<%= build_dir %>',
                    dest: '<%= build_dir %>',
                    expand: true
                }
            ]
        },
        login: {
            files: [
                {
                    src: [ '<%= login_files.js %>' ],
                    cwd: '<%= build_dir %>',
                    dest: '<%= build_dir %>',
                    expand: true
                }
            ]
        }
    });

    grunt.loadNpmTasks('grunt-ngmin');
};