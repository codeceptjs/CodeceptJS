/* eslint-disable dot-notation */
const event = require('../event')

class Hook {
  constructor(context, error) {
    this.suite = context.suite
    this.test = context.test
    this.runnable = context?.ctx?.test
    this.ctx = context.ctx
    this.error = error
  }

  get hookName() {
    return this.constructor.name.replace('Hook', '')
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
      event.emit(eventType, new BeforeHook(suite))
      break
    case 'after each':
      event.emit(eventType, new AfterHook(suite, error))
      break
    case 'before all':
      event.emit(eventType, new BeforeSuiteHook(suite))
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
