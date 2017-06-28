const path = require("path");
const fs = require("fs");
const _ = require("underscore");
const mustache = require("mustache");
const exec = require("child_process");
const preprocessorFactory = require("./elm-preprocessor");



let createPattern = function (path) {
    return {pattern: path, included: true, served: true, watched: true}
};
let initElmTest = function(files, clientConfig, logger){
    const log = logger.create("preprocessor.elm");
    let elmConfig = (clientConfig || {})["elm-test"];

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

    //add required paths to source directories
    let srcDirs = base["source-directories"];
    if (typeof srcDirs === "string"){
        srcDirs = [srcDirs];
    }
    srcDirs=srcDirs.concat(elmConfig["test-source-directories"] || []);
    srcDirs=_.map(srcDirs, p=>path.resolve(p));
    srcDirs.push(path.join(__dirname, "../browser-src/"));
    base["source-directories"] =srcDirs;

    //write modified elm-package.json for private use in plugin
    fs.writeFileSync(
        path.join(__dirname, "../browser-src/elm-package.json"), JSON.stringify(base), "utf8"
    );
    exec.execSync("elm-package install", {cwd:path.join(__dirname, "../browser-src"), stdio:'inherit'});

    //compile initial version (doing it via preprocessor after startup creates a race condition
    try {
        preprocessorFactory.compile(elmConfig);
    } catch (err){
        log.error(err);
    }

    //Add adapter & compiled js to files
    files.unshift(createPattern(path.join(__dirname, "../browser-src/adapter.js")));
    files.unshift(createPattern(path.join(__dirname, "../browser-src/allTheTests.js")));
};
initElmTest.$inject = ["config.files", "config.client", "logger"];

module.exports = {
    "framework:elm-test":["factory", initElmTest],
    "preprocessor:elm": ["factory", preprocessorFactory.create]
};