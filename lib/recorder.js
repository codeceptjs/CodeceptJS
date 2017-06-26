/**
 * Module dependencies.
 */

var Suite = require('mocha/lib/suite');
var Test = require('mocha/lib/test');
var event = require('../event');
var scenario = require('../scenario');
var recorder = require('../recorder');
var escapeRe = require('escape-string-regexp');

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
module.exports = function (suite) {
  var suites = [suite];
  suite.timeout(0);
  var afterAllHooks, afterEachHooks, afterAllHooksAreLoaded, afterEachHooksAreLoaded;

  suite.on('pre-require', function (context, file, mocha) {
    var common = require('mocha/lib/interfaces/common')(suites, context);

    // create dispatcher

    context.BeforeAll = common.before;
    context.AfterAll = common.after;

    context.run = mocha.options.delay && common.runWithSuite(suite);
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     */

    context.Feature = function (title, opts) {
      if (suites.length > 1) {
        suites.shift();
      }
      if (!opts) opts = {};

      afterAllHooks = [];
      afterEachHooks = [];
      afterAllHooksAreLoaded = false;
      afterEachHooksAreLoaded = false;

      var suite = Suite.create(suites[0], title);
      suite.timeout(0);

      if (opts.retries) suite.retries(opts.retries);
      if (opts.timeout) suite.timeout(opts.timeout);

      suite.file = file;
      suites.unshift(suite);
      suite.beforeEach('codeceptjs.before', scenario.setup);
      afterEachHooks.push(['finialize codeceptjs', scenario.teardown])

      suite.beforeAll('codeceptjs.beforeSuite', () => scenario.suiteSetup(suite));
      afterAllHooks.push(['codeceptjs.afterSuite', () => scenario.suiteTeardown(suite)])

      return suite;
    };

    context.BeforeSuite = function (fn) {
      suites[0].beforeAll('BeforeSuite', scenario.injected(fn, suites[0], 'beforeSuite'));
    };

    context.AfterSuite = function (fn) {
      afterAllHooks.unshift(['AfterSuite', scenario.injected(fn, suites[0], 'afterSuite')]);
    };

    context.Background = context.Before = function (fn) {
      suites[0].beforeEach('Before', scenario.injected(fn, suites[0], 'before'));
    };

    context.After = function (fn) {
      afterEachHooks.unshift(['After', scenario.injected(fn, suites[0], 'after')])
    };

    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     */
    context.Scenario = function (title, opts, fn) {
      if (typeof opts === 'function' && !fn) {
        fn = opts;
        opts = {};
      }
      if (!afterAllHooksAreLoaded) {
        afterAllHooks.forEach(function (hook) {
          suites[0].afterAll(hook[0], hook[1])
        })
        afterAllHooksAreLoaded = true;
      }
      if (!afterEachHooksAreLoaded) {
        afterEachHooks.forEach(function (hook) {
          suites[0].afterEach(hook[0], hook[1])
        })
        afterEachHooksAreLoaded = true;
      }
      var suite = suites[0];
      if (suite.pending) {
        fn = null;
      }
      var test = new Test(title, fn);
      test.fullTitle = () => `${suite.title}: ${title}`;
      test.file = file;
      test.async = true;
      test.timeout(0);

      if (opts.retries) test.retries(opts.retries);
      if (opts.timeout) test.timeout(opts.timeout);
      test.opts = opts;

      suite.addTest(scenario.test(test));
      return test;
    };

    /**
     * Exclusive test-case.
     */
    context.Scenario.only = function (title, fn) {
      var test = context.Scenario(title, fn);
      var reString = '^' + escapeRe(test.fullTitle()) + '$';
      mocha.grep(new RegExp(reString));
    };

    /**
     * Pending test case.
     */
    context.xScenario = context.Scenario.skip = function (title) {
      context.Scenario(title, {});
    };
  });
};
