//clean build and complile dir

module.exports = function(grunt) {
    grunt.config.set('clean', [
        '<%= build_dir %>',
        '<%= compile_dir %>'
    ]);

    grunt.loadNpmTasks('grunt-contrib-clean');
};
