const event = require('../event')
const container = require('../container')

module.exports = function () {
  event.dispatcher.on(event.hook.failed, err => {
    container.result().addStats({ failedHooks: 1 })
  })

  event.dispatcher.on(event.test.before, test => {
    container.result().addTest(test)
  })
}
