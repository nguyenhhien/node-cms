module.exports = {
    build_dir: 'build',
    compile_dir: 'bin',

    //main app_files
    app_files: {
        //js file under cms & common folder
        js: [ 'src/**/*.js', '!src/login/**/*.js', '!src/**/*.spec.js', '!src/assets/**/*.js' ],
        jsunit: [ 'src/**/*.spec.js', '!src/login/*.spec.js'],

        //template files
        atpl: [ 'src/cms/**/*.tpl.html' ],
        ctpl: [ 'src/common/**/*.tpl.html' ],

        //html & less
        html: [ 'src/index.html'],
        less: 'src/less/cms.less'
    },

    //main test files
    test_files: {
        js: [
            'vendor/angular-mocks/angular-mocks.js'
        ]
    },

    //main vendor files
    vendor_files: {
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
            'vendor/angular-chosen-localytics/chosen.js',
            'vendor/angular-data/dist/angular-data.min.js',
            'vendor/superagent/superagent.js',
            'vendor/growl/javascripts/jquery.growl.js',
            'vendor/fancybox/source/jquery.fancybox.js',
            'vendor/jquery-ui/ui/jquery.ui.widget.js',
            'vendor/blueimp-file-upload/js/jquery.fileupload.js',
            'vendor/bootstrap-sidebar/dist/js/sidebar.js'
        ],
        css: [
            'vendor/growl/stylesheets/jquery.growl.css',
            'vendor/fancybox/source/jquery.fancybox.css',
            'vendor/bootstrap-sidebar/dist/css/sidebar.css'
        ],
        assets: [

        ]
    }
};
