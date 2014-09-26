//concat list of files -- and save to destination folder
module.exports = function(grunt) {
    grunt.config.set('concat', {
        //concat vendor + main less files
        cms_css: {
            src: [
                '<%= cms_vendor_files.css %>',
                '<%= less.build_cms.dest %>'
            ],
            dest: '<%= less.build_cms.dest %>'
        },
        cms_js: {
            options: {
                //banner: '<%= meta.banner %>'
            },
            //vendor files + files under cms (modules angular route files) + common templates
            src: [
                '<%= cms_vendor_files.js %>',
                'module.prefix',
                '<%= build_dir %>/cms/**/*.js',
                '<%= html2js.cms.dest %>',
                '<%= html2js.common.dest %>',
                'module.suffix'
            ],
            dest: '<%= compile_dir %>/assets/<%= pkg.name %>-cms-<%= pkg.version %>.js'
        },
        //concat vendor + main less files
        login_vendor_files: {
            src: [
                '<%= login_vendor_files.css %>',
                '<%= less.build_login.dest %>'
            ],
            dest: '<%= less.build_login.dest %>'
        },
        login_js: {
            options: {
                //banner: '<%= meta.banner %>'
            },
            //vendor files + files under login modules + common templates
            src: [
                '<%= login_vendor_files.js %>',
                'module.prefix',
                '<%= build_dir %>/login/**/*.js',
                '<%= html2js.login.dest %>',
                'module.suffix'
            ],
            dest: '<%= compile_dir %>/assets/<%= pkg.name %>-login-<%= pkg.version %>.js'
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
};
