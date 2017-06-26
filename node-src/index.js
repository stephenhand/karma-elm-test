let path = require("path");
let fs = require("fs");
let _ = require("underscore");
let mustache = require("mustache");
const exec = require("child_process");


let createPattern = function (path) {
    return {pattern: path, included: true, served: true, watched: false}
};
let initElmTest = function(files, config){
    console.log("initElmTest: files: "+JSON.stringify(files));
    config = config || {};
    config.client = config.client || {};
    let elmConfig = config.client["elm-test"] || {};

    //Generate elm start page that executes tests
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

    //Generate elm-package.json to build the tests
    let base = JSON.parse(fs.readFileSync(elmConfig["base-elm-package-config"] || "./elm-package.json", "utf8"));
    //Add dependencies used by tests if they aren't there already
    base.dependencies=Object.assign({
        "elm-community/elm-test": "4.1.0 <= v <= 5.0.0",
        "elm-community/html-test-runner":"1.0.0 <= v < 3.0.0",
        "elm-lang/core": "5.1.1 <= v < 6.0.0",
        "elm-lang/html": "2.0.0 <= v < 3.0.0",
        "mgold/elm-random-pcg": "4.0.2 <= v < 6.0.0",
    },base.dependencies);
    let srcDirs = base["source-directories"];
    if (typeof srcDirs === "string"){
        srcDirs = [srcDirs];
    }
    srcDirs=_.map(srcDirs, p=>path.resolve(p));
    srcDirs.push(path.join(__dirname, "../browser-src/"));
    base["source-directories"] =srcDirs;
    fs.writeFileSync(
        path.join(__dirname, "../browser-src/elm-package.json"), JSON.stringify(base), "utf8"
    );
    let compileCmd = "elm-make " + path.join("Karma", "Bootstrap.elm") + " --output=allTheTests.js";
    //install the packages and compile the elm
    console.log(JSON.stringify(exec.execSync("elm-package install", {cwd:path.join(__dirname, "../browser-src"), stdio:'inherit'})));
    exec.execSync(compileCmd, {cwd:path.join(__dirname, "../browser-src")});

    //Add adapter & compiled js to files
    files.unshift(createPattern(path.join(__dirname, "../browser-src/adapter.js")));
    files.unshift(createPattern(path.join(__dirname, "../browser-src/allTheTests.js")));
};
initElmTest.$inject = ['config.files', 'config'];

module.exports = {
    "framework:elm-test":["factory", initElmTest]
};