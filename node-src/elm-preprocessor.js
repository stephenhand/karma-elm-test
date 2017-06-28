let path = require("path");
let fs = require("fs");
let _ = require("underscore");
let mustache = require("mustache");
const exec = require("child_process");
const crypto = require('crypto');

const doCompile = function(elmConfig){

    //Generate bootstrap file
    let template = fs.readFileSync(path.join(__dirname, "../browser-src/Karma/Bootstrap.elm.template"), "utf8");

    let suitesConfig ={
        suites: elmConfig.suites,
        tests:_.chain(elmConfig.suites)
            .pluck("tests")
            .flatten()
            .values()
            .join(",\r\n    ")
    };

    fs.writeFileSync(path.join(__dirname, "../browser-src/Karma/Bootstrap.elm"), mustache.render(
        template,
        suitesConfig
    ), "utf8");

    //install the packages and compile the elm using external dependencies
    let compileCmd = "elm-make " + path.join("Karma", "Bootstrap.elm") + " --output=allTheTests.js";
    exec.execSync(compileCmd, {cwd:path.join(__dirname, "../browser-src")});
};

const createElmPreprocessor= (args, clientConfig, logger)=>{
    const log = logger.create("preprocessor.elm");
    const alreadyProcessed = {};
    return (content, file, done)=>{
        elmConfig = (clientConfig || {})["elm-test"];
        //only run the compilation if the same file has been processed before (i.e. it is being reprocessed due to a change).
        //this preprocessor rebuilds the entire project so we don't want to rerun it for every watched file on startup, and the compile is run on project start anyway.
        var compilerError = null;
        if (alreadyProcessed[file]){
            try{

                doCompile(elmConfig);
            }
            catch(err){
                compilerError = err;
                log.error(err);
            }
        }
        let transformPath = elmConfig.transformPath ||  ((filepath)=> filepath.replace(/\.elm$/, '.js'));
        file.path = transformPath(file.originalPath);
        alreadyProcessed[file]=alreadyProcessed;

        done(compilerError, "//All compiled elm test code is in allTheTests.js");

    }
};

createElmPreprocessor.$inject = ["args", "config.client", "logger"];

// PUBLISH DI MODULE
module.exports = {
    create:createElmPreprocessor,
    compile:doCompile
};