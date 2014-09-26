module.exports = function(grunt) {
    grunt.config.set('copy',{
        //copy assets to compile and build folder
        build_cms_assets: {
            files: [
                {
                    src: [ '**' ],
                    dest: '<%= build_dir %>/assets/',
                    cwd: 'src/assets',
                    expand: true
                }
            ]
        },
        build_vendor_assets: {
            files: [
                {
                    src: [
                        '<%= cms_vendor_files.assets %>',
                        '<%= login_vendor_files.assets %>'
                    ],
                    dest: '<%= build_dir %>/assets/',
                    cwd: '.',
                    expand: true,
                    flatten: true
                }
            ]
        },
        compile_assets: {
            files: [
                {
                    src: [ '**' ],
                    dest: '<%= compile_dir %>/assets',
                    cwd: '<%= build_dir %>/assets',
                    expand: true
                }
            ]
        },
        //copy cms files to build dir -- mainly for develop
        //(cause in build mode, we uglify directly)
        build_cmsjs: {
            files: [
                {
                    src: [ '<%= cms_files.js %>' ],
                    dest: '<%= build_dir %>/',
                    cwd: '.',
                    expand: true
                }
            ]
        },
        build_cms_vendorjs: {
            files: [
                {
                    src: [ '<%= cms_vendor_files.js %>' ],
                    dest: '<%= build_dir %>/',
                    cwd: '.',
                    expand: true
                }
            ]
        },
        //copy login files to build dir -- mainly for develop
        build_loginjs: {
            files: [
                {
                    src: [ '<%= login_files.js %>' ],
                    dest: '<%= build_dir %>/',
                    cwd: '.',
                    expand: true
                }
            ]
        },
        build_login_vendorjs: {
            files: [
                {
                    src: [ '<%= login_vendor_files.js %>' ],
                    dest: '<%= build_dir %>/',
                    cwd: '.',
                    expand: true
                }
            ]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
};