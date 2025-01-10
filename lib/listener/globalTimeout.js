const event = require('../event')
const output = require('../output')
const recorder = require('../recorder')
const Config = require('../config')
const { timeouts } = require('../store')
const debug = require('debug')('codeceptjs:timeout')
const TIMEOUT_ORDER = require('../step').TIMEOUT_ORDER

module.exports = function () {
  let timeout
  let suiteTimeout = []
  let currentTest
  let currentTimeout

  if (!timeouts) {
    console.log('Timeouts were disabled')
    return
  }

  event.dispatcher.on(event.suite.before, suite => {
    suiteTimeout = []
    let timeoutConfig = Config.get('timeout')

    debug('config:', timeoutConfig || 'none')

    if (timeoutConfig) {
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

    debug('current suite timeout:', suite.totalTimeout || 'none')
    if (suite.totalTimeout) suiteTimeout.push(suite.totalTimeout)
    output.log(`Timeouts: ${suiteTimeout}`)
    debug('active timeouts', suiteTimeout)
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

    if (timeout < 0) {
      debug('Previous steps timed out, setting timeout to 0.01s')
      step.setTimeout(0.01, TIMEOUT_ORDER.testOrSuite)
    } else {
      debug(`Setting timeout ${timeout}ms for step ${step.toCode().trim()}`)
      step.setTimeout(timeout, TIMEOUT_ORDER.testOrSuite)
    }
  })

  event.dispatcher.on(event.step.finished, step => {
    if (typeof timeout === 'number' && !Number.isNaN(timeout)) timeout -= step.duration

    if (typeof timeout === 'number' && timeout <= 0 && recorder.isRunning()) {
      debug(`step ${step.toCode().trim()} timed out`)
      if (currentTest && currentTest.callback) {
        debug(`Failing test ${currentTest.title} with timeout ${currentTimeout}s`)
        recorder.reset()
        // replace mocha timeout with custom timeout
        currentTest.timeout(0)
        currentTest.callback(new Error(`Timeout ${currentTimeout}s exceeded (with Before hook)`))
        currentTest.timedOut = true
      }
    }
  })
}

function checkForSeconds(timeout) {
  if (timeout >= 1000) {
    console.log(`Warning: Timeout was set to ${timeout}secs.\nGlobal timeout should be specified in seconds.`)
  }
}
