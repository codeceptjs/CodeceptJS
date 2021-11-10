const escapeRe = require('escape-string-regexp');
const Suite = require('mocha/lib/suite');
const Test = require('mocha/lib/test');

const scenario = require('./scenario');
const ScenarioConfig = require('./interfaces/scenarioConfig');
const FeatureConfig = require('./interfaces/featureConfig');
const addDataContext = require('./data/context');
const container = require('./container');

const setContextTranslation = (context) => {
  const contexts = container.translation().value('contexts');

  if (contexts) {
    for (const key of Object.keys(contexts)) {
      if (context[key]) {
        context[contexts[key]] = context[key];
      }
    }
  }
};

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
 * @param {Mocha.Suite} suite Root suite.
 * @ignore
 */
module.exports = function (suite) {
  const suites = [suite];
  suite.timeout(0);
  let afterAllHooks;
  let afterEachHooks;
  let afterAllHooksAreLoaded;
  let afterEachHooksAreLoaded;

  suite.on('pre-require', (context, file, mocha) => {
    const common = require('mocha/lib/interfaces/common')(suites, context, mocha);

    const addScenario = function (title, opts = {}, fn) {
      const suite = suites[0];

      if (typeof opts === 'function' && !fn) {
        fn = opts;
        opts = {};
      }
      if (suite.pending) {
        fn = null;
      }
      const test = new Test(title, fn);
      test.fullTitle = () => `${suite.title}: ${test.title}`;

      test.tags = (suite.tags || []).concat(title.match(/(\@[a-zA-Z0-9-_]+)/g) || []); // match tags from title
      test.file = file;
      if (!test.inject) {
        test.inject = {};
      }

      suite.addTest(scenario.test(test));
      if (opts.retries) test.retries(opts.retries);
      if (opts.timeout) test.totalTimeout = opts.timeout;
      test.opts = opts;

      return new ScenarioConfig(test);
    };

    // create dispatcher

    context.BeforeAll = common.before;
    context.AfterAll = common.after;

    context.run = mocha.options.delay && common.runWithSuite(suite);
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     * @global
     * @param {string} title
     * @param {Object<string, *>} [opts]
     * @returns {FeatureConfig}
     */

    context.Feature = function (title, opts) {
      if (suites.length > 1) {
        suites.shift();
      }

      afterAllHooks = [];
      afterEachHooks = [];
      afterAllHooksAreLoaded = false;
      afterEachHooksAreLoaded = false;

      const suite = Suite.create(suites[0], title);
      if (!opts) opts = {};
      suite.opts = opts;
      suite.timeout(0);

      if (opts.retries) suite.retries(opts.retries);
      if (opts.timeout) suite.totalTimeout = opts.timeout;

      suite.tags = title.match(/(\@[a-zA-Z0-9-_]+)/g) || []; // match tags from title
      suite.file = file;
      suite.fullTitle = () => `${suite.title}:`;
      suites.unshift(suite);
      suite.beforeEach('codeceptjs.before', () => scenario.setup(suite));
      afterEachHooks.push(['finalize codeceptjs', () => scenario.teardown(suite)]);

      suite.beforeAll('codeceptjs.beforeSuite', () => scenario.suiteSetup(suite));
      afterAllHooks.push(['codeceptjs.afterSuite', () => scenario.suiteTeardown(suite)]);

      if (opts.skipInfo && opts.skipInfo.skipped) {
        suite.pending = true;
        suite.opts = { ...suite.opts, skipInfo: opts.skipInfo };
      }

      return new FeatureConfig(suite);
    };

    /**
     * Pending test suite.
     * @global
     * @kind constant
     * @type {CodeceptJS.IFeature}
     */
    context.xFeature = context.Feature.skip = function (title, opts) {
      const skipInfo = {
        skipped: true,
        message: 'Skipped due to "skip" on Feature.',
      };
      return context.Feature(title, { ...opts, skipInfo });
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
      afterEachHooks.unshift(['After', scenario.injected(fn, suites[0], 'after')]);
    };

    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     * @ignore
     */
    context.Scenario = addScenario;
    /**
     * Exclusive test-case.
     * @ignore
     */
    context.Scenario.only = function (title, opts, fn) {
      const reString = `^${escapeRe(`${suites[0].title}: ${title}`.replace(/( \| {.+})?$/g, ''))}`;
      mocha.grep(new RegExp(reString));
      return addScenario(title, opts, fn);
    };

    /**
     * Pending test case.
     * @global
     * @kind constant
     * @type {CodeceptJS.IScenario}
     */
    context.xScenario = context.Scenario.skip = function (title, opts = {}, fn) {
      if (typeof opts === 'function' && !fn) {
        opts = {};
      }

      return context.Scenario(title, opts);
    };

    /**
     * Pending test case with message: 'Test not implemented!'.
     * @global
     * @kind constant
     * @type {CodeceptJS.IScenario}
     */
    context.Scenario.todo = function (title, opts = {}, fn) {
      if (typeof opts === 'function' && !fn) {
        fn = opts;
        opts = {};
      }

      const skipInfo = {
        message: 'Test not implemented!',
        description: fn ? fn.toString() : '',
      };

      return context.Scenario(title, { ...opts, skipInfo });
    };

    /**
     * For translation
     */

    setContextTranslation(context);

    addDataContext(context);
  });

  suite.on('post-require', () => {
    /**
     * load hooks from arrays to suite to prevent reordering
     */
    if (!afterEachHooksAreLoaded && Array.isArray(afterEachHooks)) {
      afterEachHooks.forEach((hook) => {
        suites[0].afterEach(hook[0], hook[1]);
      });
      afterEachHooksAreLoaded = true;
    }

    if (!afterAllHooksAreLoaded && Array.isArray(afterAllHooks)) {
      afterAllHooks.forEach((hook) => {
        suites[0].afterAll(hook[0], hook[1]);
      });
      afterAllHooksAreLoaded = true;
    }
  });
};
