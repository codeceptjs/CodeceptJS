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

  toString() {
    return this.constructor.name.replace('Hook', '')
  }

  toCode() {
    return this.toString() + '()'
  }

  retry(n) {
    // must be implemented for each hook
  }

  get title() {
    return this.ctx?.test?.title || this.name
  }

  get name() {
    return this.constructor.name
  }
}

class BeforeHook extends Hook {
  retry(n) {
    this.suite.opts['retryBefore'] = n
  }
}

class AfterHook extends Hook {
  retry(n) {
    this.suite.opts['retryAfter'] = n
  }
}

class BeforeSuiteHook extends Hook {
  retry(n) {
    this.suite.opts['retryBeforeSuite'] = n
  }
}

class AfterSuiteHook extends Hook {
  retry(n) {
    this.suite.opts['retryAfterSuite'] = n
  }
}

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
