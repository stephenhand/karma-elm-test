
karma-elm-test
==========================

A [Karma](http://karma-runner.github.io) plugin for elm to run tests written using [elm-test](https://github.com/elm-community/elm-test) to provided CI friendly, multi-browser unit testing for Elm.

This plugin is still in development and not at a stage where I'd consider it ready to publish to NPM, although I hope to get it to that stage within the next few weeks.

The elm functionality for hosting the test code in a browser was originated from the elm [html-test-runner](https://github.com/elm-community/html-test-runner)

Prerequisites
------------

This plugin currently requires elm to have been installed on the system and the elm-make & elm-packages to be on the host system's path. If you do not have these then they can be installed via npm:

~~~
sudo npm install -g elm
~~~

These instructions also assume Karma CLI is installed (if not all the karma commands have to reference the local version under 'node_modules' in your project). It can be installed using:

~~~
sudo npm install -g karma-cli
~~~


Installation
------------

In the near future this package will be published to npm as a module. Until then you can clone this repo to the local file system and then reference it as a local module in your packages.json with 'file:<karma-elm-test-repo-directory>/node-src/index.js'

Missing Functionality (required prior to publishing to NPM)
------------

* Correctly recognising & reporting skipped tests

* Fix issues with current total test count

* Testing on different host OS's

* Testing with different reporter plugins

* Write some instructions
