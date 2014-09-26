//compile html to js
module.exports = function(grunt, userConfig) {
    grunt.config.set('html2js',{
        cms: {
            options: {
                base: 'src/cms'
            },
            src: [ '<%= cms_files.atpl %>' ],
            dest: '<%= build_dir %>/templates-cms.js'
        },
        common: {
            options: {
                base: 'src/common'
            },
            src: [ '<%= cms_files.ctpl %>' ],
            dest: '<%= build_dir %>/templates-common.js'
        },
        login: {
            options: {
                base: 'src/login'
            },
            src: [ '<%= login_files.atpl %>' ],
            dest: '<%= build_dir %>/templates-login.js'
        }
    });

    grunt.loadNpmTasks('grunt-html2js');
};
