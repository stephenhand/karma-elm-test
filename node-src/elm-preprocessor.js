let path = require("path");
let fs = require("fs");
let _ = require("underscore");
let mustache = require("mustache");
const exec = require("child_process");
const crypto = require('crypto');
const findTests = require('./auto-test-discovery/runner').findTests;

const doCompile = function(elmConfig, done){

    //Generate bootstrap file
    let template = fs.readFileSync(path.join(__dirname, "../browser-src/Karma/Bootstrap.elm.template"), "utf8");
    let testElmPackageDirectory = path.join(__dirname, "../browser-src/");
    exec.execSync("elm-make", {cwd:testElmPackageDirectory});
    let base = JSON.parse(fs.readFileSync(path.join(testElmPackageDirectory, "elm-package.json"), "utf8"));
    findTests(testElmPackageDirectory,elmConfig["test-source-directories"], base["source-directories"]).then(function(output){
        console.log("FIND TESTS OUTPUT:"+JSON.stringify(output));
        var suites = output; //&& output.length || elmConfig.suites;
        let suitesConfig ={
            suites: suites,
            tests:_.chain(suites)
                .map(s=>_.map(s.tests, t=>s.module+"."+t))
                .flatten()
                .values()
                .join(",\r\n    ")
        };

        console.log("Suites config:"+JSON.stringify(suitesConfig));
        fs.writeFileSync(path.join(__dirname, "../browser-src/Karma/Bootstrap.elm"), mustache.render(
            template,
            suitesConfig
        ), "utf8");

        //install the packages and compile the elm using external dependencies
        let compileCmd = "elm-make " + path.join("Karma", "Bootstrap.elm") + " --output=allTheTests.js";
        exec.execSync(compileCmd, {cwd:testElmPackageDirectory});
        done();
    });
};

const createElmPreprocessor= (args, clientConfig, logger)=>{
    const log = logger.create("preprocessor.elm");
    const alreadyProcessed = {};
    return (content, file, done)=>{
        console.log("Preprocessing: "+JSON.stringify(file));
        elmConfig = (clientConfig || {})["elm-test"];
        //only run the compilation if the same file has been processed before (i.e. it is being reprocessed due to a change).
        //this preprocessor rebuilds the entire project so we don't want to rerun it for every watched file on startup, and the compile is run on project start anyway.
        let testElmPackageDirectory = path.join(__dirname, "../browser-src/");
        if (_.find(elmConfig["test-source-directories"], dir=>path.resolve(file.originalPath).indexOf(path.resolve(dir))==0)){
            //Make any files that
            console.log("Compiling "+file.originalPath);
            exec.execSync("elm-make "+file.originalPath+" --output=scratch.js", {cwd:testElmPackageDirectory});
        }
        let transformPath = elmConfig.transformPath ||  ((filepath)=> filepath.replace(/\.elm$/, '.js'));
        file.path = transformPath(file.originalPath);
        if (alreadyProcessed[file]){
            try{

                doCompile(elmConfig, function(){
                    done(null, "//All compiled elm test code is in allTheTests.js");
                });
            }
            catch(err){
                log.error(err);
            }
        }
        else{
            alreadyProcessed[file]=alreadyProcessed;
            done(null, "//All compiled elm test code is in allTheTests.js");
        }
    }
};

createElmPreprocessor.$inject = ["args", "config.client", "logger"];

// PUBLISH DI MODULE
module.exports = {
    create:createElmPreprocessor,
    compile:doCompile
};