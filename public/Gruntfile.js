module.exports = function ( grunt ) {
    require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});
    require('time-grunt')(grunt);

    //load config files
    var userConfig = require( './build.config.js' );

    var taskConfig = {
        pkg: grunt.file.readJSON("package.json"),

        meta: {
            banner:
                '/**\n' +
                ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                ' * <%= pkg.homepage %>\n' +
                ' *\n' +
                ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
                ' * Licensed <%= pkg.licenses.type %> <<%= pkg.licenses.url %>>\n' +
                ' */\n'
        },
        index: {
            build_cms: {
                dir: '<%= build_dir %>',
                src: [
                    '<%= cms_vendor_files.js %>',
                    '<%= build_dir %>/src/cms/*.js',
                    '<%= build_dir %>/src/common/*.js',
                    '<%= html2js.common.dest %>',
                    '<%= html2js.cms.dest %>',
                    '<%= cms_vendor_files.css %>',
                    '<%= less.build_cms.dest %>'
                ]
            },
            compile_cms: {
                dir: '<%= compile_dir %>',
                src: [
                    '<%= concat.cms_js.dest %>',
                    '<%= cms_vendor_files.css %>',
                    '<%= less.compile_cms.dest %>'
                ]
            }
        }
    };

    //init grunt with some parameters
    grunt.initConfig( grunt.util._.extend( taskConfig, userConfig ) );

        //grunt tasks
    var gruntTasks = require("./tasks");

    //load config tasks into grunt
    Object.keys(gruntTasks.config || []).forEach(function(key){
        var configTask = gruntTasks.config[key];
        configTask(grunt, userConfig);
    });

    //load register tasks into grunt
    Object.keys(gruntTasks.register || []).forEach(function(key){
        var registerTask = gruntTasks.register[key];
        registerTask(grunt, userConfig);
    });

    //index task to build indexes files
    function filterForJS ( files ) {
        return files.filter( function ( file ) {
            return file.match( /\.js$/ );
        });
    }

    function filterForCSS ( files ) {
        return files.filter( function ( file ) {
            return file.match( /\.css$/ );
        });
    }

    grunt.registerMultiTask('index', 'Process index.html template', function () {
        var dirRE = new RegExp( '^('+grunt.config('build_dir')+'|'+grunt.config('compile_dir')+')\/', 'g' );
        var jsFiles = filterForJS( this.filesSrc ).map( function ( file ) {
            return file.replace( dirRE, '' );
        });
        var cssFiles = filterForCSS( this.filesSrc ).map( function ( file ) {
            return file.replace( dirRE, '' );
        });

        grunt.file.copy('src/index.html', this.data.dir + '/index.html', {
            process: function ( contents, path ) {
                return grunt.template.process( contents, {
                    data: {
                        scripts: jsFiles,
                        styles: cssFiles,
                        version: grunt.config( 'pkg.version' )
                    }
                });
            }
        });

        grunt.file.copy('src/login.html', this.data.dir + '/login.html', {
            process: function ( contents, path ) {
                return grunt.template.process( contents, {
                    data: {
                        scripts: jsFiles,
                        styles: cssFiles,
                        version: grunt.config( 'pkg.version' )
                    }
                });
            }
        });
    });
};
