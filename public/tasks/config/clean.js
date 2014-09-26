//clean build and compile dir -- remove folder
module.exports = function(grunt, userConfig) {
    grunt.config.set('clean',{
        build: [
            '<%= build_dir %>'
        ],
        compile: [
            '<%= compile_dir %>'
        ]
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
};
