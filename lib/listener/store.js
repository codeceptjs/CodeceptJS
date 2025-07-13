const eventModule = require('../event')
const event = eventModule.default || eventModule
const storeModule = require('../store')
const store = storeModule.default || storeModule

module.exports = function () {
  event.dispatcher.on(event.suite.before, suite => {
    store.currentSuite = suite
  })

  event.dispatcher.on(event.suite.after, () => {
    store.currentSuite = null
  })

  event.dispatcher.on(event.test.before, test => {
    store.currentTest = test
  })

  event.dispatcher.on(event.test.finished, () => {
    store.currentTest = null
  })
}
