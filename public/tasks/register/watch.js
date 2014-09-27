module.exports = function(grunt, gruntAppList) {
    var settingObj = {
        options: {
            livereload: true
        },

        gruntfile: {
            files: 'Gruntfile.js',
            tasks: [ 'jshint:gruntfile' ],
            options: {
                livereload: false
            }
        },
        assets: {
            files: [
                'src/assets/**/*'
            ],
            tasks: [ 'copy:build_assets' ]
        }
    };

    gruntAppList.forEach(function(elem){
        var obj = {};

        var prefix = elem.prefix;

        obj[prefix+'jssrc'] = {
            files: [
                '<%= ' + prefix + 'app_files.js %>'
            ],
            tasks: ['jshint:' + prefix + 'src', 'copy:'+prefix+'app_js']
        }

        obj[prefix+'html'] = {
            files: ['<%= ' + prefix + 'app_files.html %>'],
            tasks: [ 'index:' + prefix + "build" ]
        }

        obj[prefix+'tpls'] = {
            files: [
                '<%= ' + prefix + 'app_files.atpl %>',
                '<%= ' + prefix + 'app_files.ctpl %>'
            ],
            tasks: [
                'html2js:' + prefix + "main",
                'html2js:' + prefix + "common"
            ]
        }

        obj[prefix+'less'] = {
            files: [
                'src/**/*.less',
                'src/'+elem.app_name+'/**/*.less',
                'src/common/**/*.less'
            ],
            tasks: [ 'less:'+prefix+'build' ]
        }

        settingObj = grunt.util._.extend(settingObj, obj);
    });


    grunt.config.set('delta', settingObj);

    grunt.loadNpmTasks('grunt-contrib-watch');
};