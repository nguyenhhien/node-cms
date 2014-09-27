module.exports = {
    build_dir: 'build',
    compile_dir: 'bin',

    //cms app
    cms_files: {
        //js file under cms & common folder
        js: [ 'src/**/*.js', '!src/login/**/*.js', '!src/**/*.spec.js', '!src/assets/**/*.js' ],
        jsunit: [ 'src/**/*.spec.js' ],

        //template files
        atpl: [ 'src/cms/**/*.tpl.html' ],
        ctpl: [ 'src/common/**/*.tpl.html' ],

        //html & less
        html: [ 'src/index.html'],
        less: 'src/less/cms.less'
    },

    cms_test_files: {
        js: [
          'vendor/angular-mocks/angular-mocks.js'
        ]
    },

    cms_vendor_files: {
        js: [
          'vendor/jquery/dist/jquery.js',
          'vendor/bootstrap/dist/js/bootstrap.js',
          'vendor/angular/angular.js',
          'vendor/angular-resource/angular-resource.js',
          'vendor/angular-strap/dist/angular-strap.js',
          'vendor/angular-strap/dist/angular-strap.tpl.js',
          'vendor/angular-bootstrap/ui-bootstrap.js',
          'vendor/angular-bootstrap/ui-bootstrap-tpls.js',
          'vendor/angular-classy/angular-classy.js',
          'vendor/angular-bootstrap/ui-bootstrap-tpls.min.js',
          'vendor/angular-placeholders/dist/placeholders-0.0.1-SNAPSHOT.min.js',
          'vendor/angular-ui-router/release/angular-ui-router.js',
          'vendor/angular-ui-utils/ui-utils.js',
          'vendor/angular-cookies/angular-cookies.js',
          'vendor/cryptojslib/rollups/md5.js',
          'vendor/lodash/dist/lodash.js',
          'vendor/async/lib/async.js',
          'vendor/chosen/chosen.jquery.js',
          'vendor/angular-chosen-localytics/chosen.js'
        ],
        css: [
        ],
        assets: [
        ]
    },

    //login modules
    login_files: {
        js: [
            'src/login/**/*.js'
        ],
        atpl: [
            'src/login/**/*.tpl.html'
        ],
        html: [
            'src/login.html'
        ],
        less: 'src/less/login.less'
    },
    login_test_files: {
        js: [
        ]
    },
    login_vendor_files:
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
};
