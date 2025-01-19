const event = require('../event')

/**
 * Sample custom reporter for CodeceptJS.
 */
module.exports = function (config) {
  event.dispatcher.on(event.hook.before, hook => {
    if (config.onHookBefore) {
      config.onHookBefore(hook)
    }
  })

  event.dispatcher.on(event.test.before, test => {
    if (config.onTestBefore) {
      config.onTestBefore(test)
    }
  })

  event.dispatcher.on(event.test.failed, test => {
    if (config.onTestFailed) {
      config.onTestFailed(test)
    }
  })

  event.dispatcher.on(event.all.result, result => {
    if (config.onAllResult) {
      config.onResult(result)
    }

    if (config.save) {
      result.save()
    }
  })
}
