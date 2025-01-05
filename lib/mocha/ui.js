const escapeRe = require('escape-string-regexp')
const { test, setup, teardown, suiteSetup, suiteTeardown, injected } = require('./asyncWrapper')
const ScenarioConfig = require('./scenarioConfig')
const FeatureConfig = require('./featureConfig')
const addDataContext = require('../data/context')
const { createTest } = require('./test')
const { createSuite } = require('./suite')
const { HookConfig, AfterSuiteHook, AfterHook, BeforeSuiteHook, BeforeHook } = require('./hooks')

const setContextTranslation = context => {
  const container = require('../container')
  const contexts = container.translation().value('contexts')

  if (contexts) {
    for (const key of Object.keys(contexts)) {
      if (context[key]) {
        context[contexts[key]] = context[key]
      }
    }
  }
}

/**
 * Codecept-style interface:
 *
 * Feature('login');
 *
 * Scenario('login as regular user', ({I}) {
 *   I.fillField();
 *   I.click();
 *   I.see('Hello, '+data.login);
 * });
 *
 * @param {Mocha.Suite} suite Root suite.
 * @ignore
 */
module.exports = function (suite) {
  const suites = [suite]
  suite.timeout(0)
  let afterAllHooks
  let afterEachHooks
  let afterAllHooksAreLoaded
  let afterEachHooksAreLoaded

  suite.on('pre-require', (context, file, mocha) => {
    const common = require('mocha/lib/interfaces/common')(suites, context, mocha)

    const addScenario = function (title, opts = {}, fn) {
      const suite = suites[0]

      if (typeof opts === 'function' && !fn) {
        fn = opts
        opts = {}
      }
      if (suite.pending) {
        fn = null
      }
      const test = createTest(title, fn)
      test.file = file
      test.addToSuite(suite)
      test.applyOptions(opts)

      return new ScenarioConfig(test)
    }

    // create dispatcher

    context.BeforeAll = common.before
    context.AfterAll = common.after

    context.run = mocha.options.delay && common.runWithSuite(suite)
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
        suites.shift()
      }

      afterAllHooks = []
      afterEachHooks = []
      afterAllHooksAreLoaded = false
      afterEachHooksAreLoaded = false

      const suite = createSuite(suites[0], title)
      suite.applyOptions(opts)

      suite.file = file
      suites.unshift(suite)
      suite.beforeEach('codeceptjs.before', () => setup(suite))
      afterEachHooks.push(['finalize codeceptjs', () => teardown(suite)])

      suite.beforeAll('codeceptjs.beforeSuite', () => suiteSetup(suite))
      afterAllHooks.push(['codeceptjs.afterSuite', () => suiteTeardown(suite)])

      return new FeatureConfig(suite)
    }

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
      }
      return context.Feature(title, { ...opts, skipInfo })
    }

    context.BeforeSuite = function (fn) {
      suites[0].beforeAll('BeforeSuite', injected(fn, suites[0], 'beforeSuite'))
      return new HookConfig(new BeforeSuiteHook({ suite: suites[0] }))
    }

    context.AfterSuite = function (fn) {
      afterAllHooks.unshift(['AfterSuite', injected(fn, suites[0], 'afterSuite')])
      return new HookConfig(new AfterSuiteHook({ suite: suites[0] }))
    }

    context.Background = context.Before = function (fn) {
      suites[0].beforeEach('Before', injected(fn, suites[0], 'before'))
      return new HookConfig(new BeforeHook({ suite: suites[0] }))
    }

    context.After = function (fn) {
      afterEachHooks.unshift(['After', injected(fn, suites[0], 'after')])
      return new HookConfig(new AfterHook({ suite: suites[0] }))
    }

    /**
     * Describe a specification or test-case
     * with the given `title` and callback `fn`
     * acting as a thunk.
     * @ignore
     */
    context.Scenario = addScenario
    /**
     * Exclusive test-case.
     * @ignore
     */
    context.Scenario.only = function (title, opts, fn) {
      const reString = `^${escapeRe(`${suites[0].title}: ${title}`.replace(/( \| {.+})?$/g, ''))}`
      mocha.grep(new RegExp(reString))
      process.env.SCENARIO_ONLY = true
      return addScenario(title, opts, fn)
    }

    /**
     * Pending test case.
     * @global
     * @kind constant
     * @type {CodeceptJS.IScenario}
     */
    context.xScenario = context.Scenario.skip = function (title, opts = {}, fn) {
      if (typeof opts === 'function' && !fn) {
        opts = {}
      }

      return context.Scenario(title, opts)
    }

    /**
     * Pending test case with message: 'Test not implemented!'.
     * @global
     * @kind constant
     * @type {CodeceptJS.IScenario}
     */
    context.Scenario.todo = function (title, opts = {}, fn) {
      if (typeof opts === 'function' && !fn) {
        fn = opts
        opts = {}
      }

      const skipInfo = {
        message: 'Test not implemented!',
        description: fn ? fn.toString() : '',
      }

      return context.Scenario(title, { ...opts, skipInfo })
    }

    /**
     * For translation
     */

    setContextTranslation(context)

    addDataContext(context)
  })

  suite.on('post-require', () => {
    /**
     * load hooks from arrays to suite to prevent reordering
     */
    if (!afterEachHooksAreLoaded && Array.isArray(afterEachHooks)) {
      afterEachHooks.forEach(hook => {
        suites[0].afterEach(hook[0], hook[1])
      })
      afterEachHooksAreLoaded = true
    }

    if (!afterAllHooksAreLoaded && Array.isArray(afterAllHooks)) {
      afterAllHooks.forEach(hook => {
        suites[0].afterAll(hook[0], hook[1])
      })
      afterAllHooksAreLoaded = true
    }
  })
}
