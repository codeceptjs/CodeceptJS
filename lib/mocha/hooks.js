const event = require('../event')
const { serializeError } = require('../utils')
// const { serializeTest } = require('./test')

/**
 * Represents a test hook in the testing framework
 * @class
 * @property {Object} suite - The test suite this hook belongs to
 * @property {Object} test - The test object associated with this hook
 * @property {Object} runnable - The current test being executed
 * @property {Object} ctx - The context object
 * @property {Error|null} err - The error that occurred during hook execution, if any
 */
class Hook {
  /**
   * Creates a new Hook instance
   * @param {Object} context - The context object containing suite and test information
   * @param {Object} context.suite - The test suite
   * @param {Object} context.test - The test object
   * @param {Object} context.ctx - The context object
   * @param {Error} error - The error object if hook execution failed
   */
  constructor(context, error) {
    this.suite = context.suite
    this.test = context.test
    this.runnable = context?.ctx?.test
    this.ctx = context.ctx
    this.err = error
  }

  get hookName() {
    return this.constructor.name.replace('Hook', '')
  }

  simplify() {
    return {
      hookName: this.hookName,
      title: this.title,
      // test: this.test ? serializeTest(this.test) : null,
      // suite: this.suite ? serializeSuite(this.suite) : null,
      error: this.err ? serializeError(this.err) : null,
    }
  }

  toString() {
    return this.hookName
  }

  toCode() {
    return this.toString() + '()'
  }

  retry(n) {
    this.suite.opts[`retry${this.hookName}`] = n
  }

  get title() {
    return this.ctx?.test?.title || this.name
  }

  get name() {
    return this.constructor.name
  }
}

class BeforeHook extends Hook {}

class AfterHook extends Hook {}

class BeforeSuiteHook extends Hook {}

class AfterSuiteHook extends Hook {}

function fireHook(eventType, suite, error) {
  const hook = suite.ctx?.test?.title?.match(/"([^"]*)"/)[1]
  switch (hook) {
    case 'before each':
      event.emit(eventType, new BeforeHook(suite, error))
      break
    case 'after each':
      event.emit(eventType, new AfterHook(suite, error))
      break
    case 'before all':
      event.emit(eventType, new BeforeSuiteHook(suite, error))
      break
    case 'after all':
      event.emit(eventType, new AfterSuiteHook(suite, error))
      break
    default:
      event.emit(eventType, suite, error)
  }
}

class HookConfig {
  constructor(hook) {
    this.hook = hook
  }

  retry(n) {
    this.hook.retry(n)
    return this
  }
}

module.exports = {
  BeforeHook,
  AfterHook,
  BeforeSuiteHook,
  AfterSuiteHook,
  fireHook,
  HookConfig,
}
