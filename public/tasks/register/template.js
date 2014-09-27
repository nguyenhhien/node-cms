//this is in-charge of compiling entry templates
module.exports = function(grunt, gruntAppList) {
    var settingObj = {};

    //create concat tasks for each apps
    gruntAppList.forEach(function(elem){
        var prefix = elem.prefix;

        var obj = {};

        obj[(prefix + "build")] = {
            dir: '<%= ' + prefix + 'build_dir %>',
            src: [
                '<%= ' + prefix + 'vendor_files.js %>',
                '<%= ' + prefix + 'build_dir %>/src/' + elem.app_name + '/*.js',
                '<%= ' + prefix + 'build_dir %>/src/' + elem.app_name + '/**/*.js',
                '<%= ' + prefix + 'build_dir %>/src/common/**/*.js',
                '<%= html2js.' + prefix + 'common.dest %>',
                '<%= html2js.' + prefix + 'main.dest %>',
                '<%= ' + prefix + 'vendor_files.css %>',
                '<%= less.' + prefix + 'build.dest %>'
            ]
        };

        //this is for distribution cause in dev-mode, we only copy js files
        obj[(prefix + "compile")] = {
            dir: '<%= ' + prefix + 'compile_dir %>',
            src: [
                '<%= concat.' + prefix + 'js.dest %>',
                '<%= ' + prefix + 'vendor_files.css %>',
                '<%= less.' + prefix + 'compile.dest %>'
            ]
        };

        settingObj = grunt.util._.extend(settingObj, obj);
    });

    grunt.config.set('index', settingObj);

    //need to register multitask also
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
        //TODO: assumption that all modules share the same build dir -- so we use the same prefix
        var prefix = 'cms_';
        var dirRE = new RegExp( '^('+grunt.config(prefix+'build_dir')+'|'+grunt.config(prefix+'compile_dir')+')\/', 'g' );

        var jsFiles = filterForJS( this.filesSrc ).map( function ( file ) {
            return file.replace( dirRE, '' );
        });
        var cssFiles = filterForCSS( this.filesSrc ).map( function ( file ) {
            return file.replace( dirRE, '' );
        });

        switch(this.target)
        {
            //cms modules
            case 'cms_build':
            case 'cms_compile':
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

                break;

            //login modules
            case 'login_build':
            case 'login_compile':
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

                break;
        }
    });

};