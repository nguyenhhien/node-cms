//general build function to support building multiple apps
function GruntAppBuilder(app_name, options)
{
    this.app_name = app_name;

    //build folders
    this.build_dir = options.build_dir || "build";
    this.compile_dir = options.compile_dir || "bin";

    //list of vendor files -- subfields are in <app_name>.config.js
    this.vendor_files = options.vendor_files || [];

    //main app files
    this.app_files = options.app_files || [];

    //js test files
    this.test_files = options.test_files || [];

    //templates files
    this.tpl_files = options.tpl_files || [];

    this._loaded_grunt = false;

    //append prefix to the key
    this.prefix = this.app_name + "_";
}

//load grunt and set its config
GruntAppBuilder.prototype.loadGrunt = function(grunt)
{
    var that = this;

    var configFields = [
        "build_dir",
        "compile_dir",
        "vendor_files",
        "app_files",
        "test_files",
        "tpl_files"
    ];

    var prefix = this.prefix;

    var configObj = {};

    configFields.forEach(function(elem){
        configObj[prefix + elem] = that[elem];
    });

    //merge those app specific config files into global grunt files
    //load it into grunt config has benefit of allowing passing directly argument
    grunt.config.merge(configObj);

    this._loaded_grunt = true;
};

module.exports = function ( grunt ) {
    require('load-grunt-tasks')(grunt, {scope: 'devDependencies'});
    require('time-grunt')(grunt);

    var beaverCms = new GruntAppBuilder("cms", require("./cms.config.js"));
    var beaverLogin = new GruntAppBuilder("login", require("./login.config.js"));

    //initialize grunt for those newly registered apps
    beaverCms.loadGrunt(grunt);
    beaverLogin.loadGrunt(grunt);

    //set pkg to package.json files
    grunt.config.set("pkg", grunt.file.readJSON("package.json"));

    //grunt app list
    var gruntAppList = [beaverCms, beaverLogin];

    //grunt tasks
    var gruntTasks = require("./tasks");

    grunt.renameTask( 'watch', 'delta' );

    //load config tasks into grunt -- pass all app list to create task directly
    Object.keys(gruntTasks.config || []).forEach(function(key){
        var configTask = gruntTasks.config[key];
        configTask(grunt, gruntAppList);
    });

    //load register tasks into grunt -- pass all app list to create task directly
    Object.keys(gruntTasks.register || []).forEach(function(key){
        var registerTask = gruntTasks.register[key];
        registerTask(grunt, gruntAppList);
    });

    grunt.registerTask( 'watch', [ 'build', 'delta' ] );

    grunt.registerTask("test", function(){
        //console.log("clean", grunt.config.get("login_app_files"));
        console.log("grunt watch", grunt.config.get("delta").login_jssrc);
    });
};
