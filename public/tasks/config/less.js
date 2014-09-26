module.exports = function(grunt) {
    grunt.config.set('less', {
        build_cms: {
            src: [ '<%= cms_files.less %>' ],
            dest: '<%= build_dir %>/assets/<%= pkg.name %>-cms-<%= pkg.version %>.css',
            options: {
                compile: true,
                compress: false,
                noUnderscores: false,
                noIDs: false,
                zeroUnits: false
            }
        },
        compile_cms: {
            src: [ '<%= less.build_cms.dest %>' ],
            dest: '<%= less.build_cms.dest %>',
            options: {
                compile: true,
                compress: true,
                noUnderscores: false,
                noIDs: false,
                zeroUnits: false
            }
        },
        build_login: {
            src: [ '<%= login_files.less %>' ],
            dest: '<%= build_dir %>/assets/<%= pkg.name %>-login-<%= pkg.version %>.css',
            options: {
                compile: true,
                compress: false,
                noUnderscores: false,
                noIDs: false,
                zeroUnits: false
            }
        },
        compile_login: {
            src: [ '<%= less.build_login.dest %>' ],
            dest: '<%= less.build_login.dest %>',
            options: {
                compile: true,
                compress: true,
                noUnderscores: false,
                noIDs: false,
                zeroUnits: false
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
};