const event = require('../event')
const container = require('../container')

module.exports = function () {
  event.dispatcher.on(event.hook.failed, err => {
    container.result().addStats({ failedHooks: 1 })
  })

  event.dispatcher.on(event.test.started, test => {
    container.result().addStats({ tests: 1 })
    container.result().addTest(test)
  })
}
