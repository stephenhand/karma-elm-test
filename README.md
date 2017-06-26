
karma-elm-test
==========================

A work in progress [Karma](http://karma-runner.github.io) plugin for elm to run tests written using [elm-test](https://github.com/elm-community/elm-test) to provided CI friendly, multi-browser unit testing for Elm.

This plugin is still in early stages of development and not at a stage where I'd consider it ready to publish to NPM, although I hope to get it to that stage within the next few weeks.

The elm functionality for hosting the test code in a browser was originated from the elm [html-test-runner](https://github.com/elm-community/html-test-runner)

Missing Functionality (required prior to publishing to NPM)
------------

* Add config option to specify source roots for test suites

* Autowatch functionality (currently only runs once)

* Correctly recognising & reporting skipped tests

* Fix issues with current

* Evaluate whether the current approach of basing the elm-package.json for the tests on that of the main project is going to work / be robust

* Testing on Linux

* Testing against a wider variety of test suites

* Testing with different reporters
