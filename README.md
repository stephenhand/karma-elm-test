
karma-elm-test
==========================

A [Karma](http://karma-runner.github.io) plugin for elm to run tests written using [elm-test](https://github.com/elm-community/elm-test) to provided CI friendly, multi-browser unit testing for Elm.

The elm functionality for hosting the test code in a browser originated from the elm [html-test-runner](https://github.com/elm-community/html-test-runner).

Prerequisites
------------

This plugin currently requires elm to have been installed on the system and the elm-make & elm-packages to be on the host system's path. If you do not have these then they can be installed via npm:

~~~
npm install -g elm
~~~

These instructions also assume Karma CLI is installed (if not all the karma commands have to reference the local version under 'node_modules' in your project). It can be installed using:

~~~
npm install -g karma-cli
~~~

NOTE: ensure you install karma-cli globally, NOT karma itself, doing this will cause problems!

Karma needs to be installed in your project as a dev dependency via npm:

~~~
npm install --save-dev karma
~~~

Installation
------------

This can be installed into your projects dev dependencies via npm with

~~~
npm install --save-dev karma-elm-test
~~~


Configuration
------------

The current version requires pretty verbose config, something I hope to improve in upcoming versions.

I created a branch of elm-css converted to run its tests in karma using this plugin here: https://github.com/stephenhand/elm-css the karma.conf.js included here is a good reference example of how to configure the plugin.

Firstly, the plugin needs 'elm-test' to be registered as a framework AND 'elm' to be registered as a preprocessor, so something like:

~~~
        preprocessors: {
            "./src/**/*.elm": ['elm'],
            "./tests/**/*.elm": ['elm']
        },
        frameworks: ["elm-test"],
~~~

Second, all your elm files, production and test need to be specified under 'files':

~~~
        files: ["./src/**/*.elm", "./tests/**/*.elm"],
~~~

Finally, a root 'client' item needs adding with an 'elm-test' item under that, which needs to contain the following:

A 'test-source-directories' array containing the paths to your elm test source. These are relative to the project root and are specified in the same way as source directory paths in your elm-pacages.json.

~~~
    "test-source-directories" : [
        "./tests"
    ]
~~~

A 'suites' array containing a list of all the modules containing your tests and the fully qualified function calls required to execute them. For example:

~~~
    suites:[
        {
            module:"Compile",
            tests:["Compile.colorWarnings","Compile.unstyledDiv","Compile.dreamwriter","Compile.compileTest"]
        },
        {
            module:"Properties",
            tests:["Properties.all"]
        },
        {
            module:"Selectors",
            tests:["Selectors.nonElements","Selectors.elements"]
        }
    ]
~~~

The above would specify 3 different modules with tests to run. The first module, 'Compile' has 4 functions exposed that run tests, 'colorWarnings', 'unstyledDiv', 'dreamwriter', 'compileTest'.

Specifying all the modules & entry functions in config is obviously less than ideal and I hope to incorporate an auto discovery mechanism in the near future to eliminate the need for this.
 
Known issues & limitations
------------

* Doesn't correctly recognise & report skipped tests

* Current total test count is wrong, usually reports one less than the correct total.

* Only supports projects where a single elm-packages.json for the code under test is in the root directory, more flexibility is required.

Roadmap
-------------

The following things are on my list for doing ASAP (in approximate priority order:

* Fix above outstanding issues

* Add unit tests ('dog fooding' running in karma via this plugin)

* Add auto discovery of tests to cut down required config

* Investigate ways of more elegantly / robustly compiling & running tests. Generating elm-packages.json and Bootstrap.elm files seems a bit kludgy (nasty unnecessary side effects!) and being able to do a fully in memory approach.

* Try to make the project 'pure node' rather than shelling out to external programs (or have those programs contained within / auto deployed alongside the plugin) to make it easier to deploy in CI.
