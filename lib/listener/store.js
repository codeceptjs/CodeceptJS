import eventModule from '../event.js'
const event = eventModule.default || eventModule
import storeModule from '../store.js'
const store = storeModule.default || storeModule

export default function () {
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
