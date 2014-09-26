module.exports = function(grunt) {
    grunt.config.set('uglify', {
        cms: {
            options: {
                //banner: '<%= meta.banner %>'
            },
            files: {
                '<%= concat.cms_js.dest %>': '<%= concat.cms_js.dest %>'
            }
        },
        login: {
            options: {
                //banner: '<%= meta.banner %>'
            },
            files: {
                '<%= concat.login_js.dest %>': '<%= concat.login_js.dest %>'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
};