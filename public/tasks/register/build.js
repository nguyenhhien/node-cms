module.exports = function (grunt) {
    //TODO: need to devide into subtasks
    grunt.registerTask('build', [
        'clean', 'html2js', 'jshint', 'less', 'copy', 'index'
    ]);
};
