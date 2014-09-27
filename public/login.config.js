module.exports = {
    build_dir: 'build',
    compile_dir: 'bin',

    //login modules
    app_files: {
        js: [
            'src/login/login.js',
            'src/login/**/*.js'
        ],
        jsunit: [ 'src/login/*.spec.js' ],
        atpl: ['src/login/**/*.tpl.html'],
        ctpl: [ 'src/common/**/*.tpl.html' ],

        html: ['src/login.html'],
        less: 'src/less/login.less'
    },
    test_files: {
        js: [
        ]
    },

    vendor_files:
    {
        js: [
            'vendor/jquery/dist/jquery.js',
            'vendor/bootstrap/dist/js/bootstrap.js',
            'vendor/angular/angular.js',
            'vendor/angular-facebook/lib/angular-facebook.js',
            'vendor/angular-google-plus/dist/angular-google-plus.js',
            'vendor/angular-classy/angular-classy.js',
            'vendor/angular-ui-router/release/angular-ui-router.js',
            'vendor/angular-ui-utils/ui-utils.js',
            'vendor/cryptojslib/rollups/md5.js',
            'vendor/angular-cookies/angular-cookies.js'
        ],
        css: [

        ],
        assets: [

        ]
    }
}