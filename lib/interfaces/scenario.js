/**
 * Module dependencies.
 */

var Suite = require('mocha/lib/suite');
var Test = require('mocha/lib/test');
var event = require('../event');
var scenario = require('../scenario');

/**
 * Codecept-style interface:
 *
 * Feature('login')
 * Scenario('login as regular user', (I) {
 *   I.fillField();
 *   I.click()
 *   I.see('Hello, '+data.login);
 * });
 *
 * @param {Suite} suite Root suite.
 */
module.exports = function(suite) {
  var suites = [suite];
  var beforeHooks = [];
  var afterHooks = [];

  suite.on('pre-require', function(context, file, mocha) {
    var common = require('mocha/lib/interfaces/common')(suites, context);

    common.before('codeceptjs event', () => {
      event.dispatcher.emit(event.suite.before);
    });

    common.after('codeceptjs event', () => {
      event.dispatcher.emit(event.suite.after);
    });    

    // create dispatcher

    context.BeforeAll = common.before;
    context.AfterAll = common.after;
    context.Before = common.beforeEach;
    context.After = common.afterEach;
    context.run = mocha.options.delay && common.runWithSuite(suite);
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     */

    context.Feature = function(title) {
      var suite = Suite.create(suites[0], title);
      suite.file = file;
      suites.unshift(suite);
      return suite;
    };

    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */

    context.Scenario = function(title, fn) {
      var suite = suites[0];
      if (suite.pending) {
        fn = null;
      }
      suite.timeout(0);

      // parse fn params
      // grab params from container
      // relace fn with new 
      // 
      // params.push( = ... containter.get()
      // fn = function() {
      //    fn.apply(context, params);
      // }
      // also it should wrap test in co
      
      var test = new Test(title, fn);
      test.file = file;
      test.async = true;
      test.timeout(0);
      suite.addTest(scenario(test));
      return test;
    };

    /**
     * Exclusive test-case.
     */
    context.Scenario.only = function(title, fn) {
      var test = context.it(title, fn);
      var reString = '^' + escapeRe(test.fullTitle()) + '$';
      mocha.grep(new RegExp(reString));
      return test;
    };

    /**
     * Pending test case.
     */
    context.xScenario = context.Scenario.skip = function(title) {
      context.Scenario(title);
    };
  });
};
