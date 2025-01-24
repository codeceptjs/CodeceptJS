const event = require('../event')
const output = require('../output')
const recorder = require('../recorder')
const Config = require('../config')
const store = require('../store')
const debug = require('debug')('codeceptjs:timeout')
const { TIMEOUT_ORDER, TimeoutError, TestTimeoutError, StepTimeoutError } = require('../timeout')
const { BeforeSuiteHook, AfterSuiteHook } = require('../mocha/hooks')

module.exports = function () {
  let timeout
  let suiteTimeout = []
  let currentTest
  let currentTimeout

  if (!store.timeouts) {
    console.log('Timeouts were disabled')
    return
  }

  // disable timeout for BeforeSuite/AfterSuite hooks
  // add separate configs to them?
  event.dispatcher.on(event.hook.started, hook => {
    if (hook instanceof BeforeSuiteHook) {
      timeout = null
      suiteTimeout = []
    }
    if (hook instanceof AfterSuiteHook) {
      timeout = null
      suiteTimeout = []
    }
  })

  event.dispatcher.on(event.suite.before, suite => {
    suiteTimeout = []
    let timeoutConfig = Config.get('timeout')

    if (timeoutConfig) {
      debug('config:', timeoutConfig)
      if (!Number.isNaN(+timeoutConfig)) {
        checkForSeconds(timeoutConfig)
        suiteTimeout.push(timeoutConfig)
      }

      if (!Array.isArray(timeoutConfig)) {
        timeoutConfig = [timeoutConfig]
      }

      for (const config of timeoutConfig.filter(c => !!c.Feature)) {
        if (config.grep) {
          if (!suite.title.includes(config.grep)) continue
        }
        suiteTimeout.push(config.Feature)
      }
    }

    if (suite.totalTimeout) suiteTimeout.push(suite.totalTimeout)
    output.log(`Timeouts: ${suiteTimeout}`)

    if (suiteTimeout.length > 0) debug(suite.title, 'timeout', suiteTimeout)
  })

  event.dispatcher.on(event.test.before, test => {
    currentTest = test
    let testTimeout = null

    let timeoutConfig = Config.get('timeout')

    if (typeof timeoutConfig === 'object' || Array.isArray(timeoutConfig)) {
      if (!Array.isArray(timeoutConfig)) {
        timeoutConfig = [timeoutConfig]
      }

      for (const config of timeoutConfig.filter(c => !!c.Scenario)) {
        console.log('Test Timeout', config, test.title.includes(config.grep))
        if (config.grep) {
          if (!test.title.includes(config.grep)) continue
        }
        testTimeout = config.Scenario
      }
    }

    timeout = test.totalTimeout || testTimeout || suiteTimeout[suiteTimeout.length - 1]
    if (!timeout) return

    debug(test.title, 'timeout', {
      'config from file': testTimeout,
      'suite timeout': suiteTimeout,
      'dynamic config': test.totalTimeout,
    })

    currentTimeout = timeout
    output.debug(`Test Timeout: ${timeout}s`)
    timeout *= 1000
  })

  event.dispatcher.on(event.test.passed, test => {
    currentTest = null
  })

  event.dispatcher.on(event.test.failed, test => {
    currentTest = null
  })

  event.dispatcher.on(event.step.before, step => {
    if (typeof timeout !== 'number') return

    if (!store.timeouts) {
      debug('step', step.toCode().trim(), 'timeout disabled')
      return
    }

    if (timeout < 0) {
      debug('Previous steps timed out, setting timeout to 0.01s')
      step.setTimeout(0.01, TIMEOUT_ORDER.testOrSuite)
    } else {
      debug(`Setting timeout ${timeout}ms for step ${step.toCode().trim()}`)
      step.setTimeout(timeout, TIMEOUT_ORDER.testOrSuite)
    }
  })

  event.dispatcher.on(event.step.after, step => {
    if (typeof timeout !== 'number') return
    if (!store.timeouts) return

    recorder.catchWithoutStop(err => {
      // we wrap timeout errors in a StepTimeoutError
      // but only if global timeout is set
      // should we wrap all timeout errors?
      if (err instanceof TimeoutError) {
        const testTimeoutExceeded = timeout && +Date.now() - step.startTime >= timeout
        debug('Step failed due to global test or suite timeout')
        if (testTimeoutExceeded) {
          debug('Test failed due to global test or suite timeout')
          throw new TestTimeoutError(currentTimeout)
        }
        throw new StepTimeoutError(currentTimeout, step)
      }
      throw err
    })
  })

  event.dispatcher.on(event.step.finished, step => {
    if (!store.timeouts) {
      debug('step', step.toCode().trim(), 'timeout disabled')
      return
    }

    if (typeof timeout === 'number') debug('Timeout', timeout)

    debug(`step ${step.toCode().trim()}:${step.status} duration`, step.duration)
    if (typeof timeout === 'number' && !Number.isNaN(timeout)) timeout -= step.duration

    if (typeof timeout === 'number' && timeout <= 0 && recorder.isRunning()) {
      debug(`step ${step.toCode().trim()} timed out`)
      recorder.throw(new TestTimeoutError(currentTimeout))
    }
  })
}

function checkForSeconds(timeout) {
  if (timeout >= 1000) {
    console.log(`Warning: Timeout was set to ${timeout}secs.\nGlobal timeout should be specified in seconds.`)
  }
}
