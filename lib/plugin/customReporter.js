const event = require('../event')

/**
 * Sample custom reporter for CodeceptJS.
 */
module.exports = function (config) {
  event.dispatcher.on(event.hook.finished, hook => {
    if (config.onHookFinished) {
      config.onHookFinished(hook)
    }
  })

  event.dispatcher.on(event.test.before, test => {
    if (config.onTestBefore) {
      config.onTestBefore(test)
    }
  })

  event.dispatcher.on(event.test.failed, (test, err) => {
    if (config.onTestFailed) {
      config.onTestFailed(test, err)
    }
  })

  event.dispatcher.on(event.test.passed, test => {
    if (config.onTestPassed) {
      config.onTestPassed(test)
    }
  })

  event.dispatcher.on(event.test.skipped, test => {
    if (config.onTestSkipped) {
      config.onTestSkipped(test)
    }
  })

  event.dispatcher.on(event.test.finished, test => {
    if (config.onTestFinished) {
      config.onTestFinished(test)
    }
  })

  event.dispatcher.on(event.all.result, result => {
    if (config.onResult) {
      config.onResult(result)
    }

    if (config.save) {
      result.save()
    }
  })
}
