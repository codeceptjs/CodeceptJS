const event = require('../event')
const store = require('../store')

module.exports = function () {
  event.dispatcher.on(event.test.before, test => {
    store.currentTest = test
  })

  event.dispatcher.on(event.test.finished, test => {
    store.currentTest = null
  })
}
