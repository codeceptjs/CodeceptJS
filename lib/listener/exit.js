import event from '../event.js'
import debugModule from 'debug'
const debug = debugModule('codeceptjs:exit')

export default function () {
  let failedTests = []

  event.dispatcher.on(event.test.failed, test => {
    const id = test.uid || (test.ctx && test.ctx.test.uid) || 'empty'
    failedTests.push(id)
  })

  // if test was successful after retries
  event.dispatcher.on(event.test.passed, test => {
    const id = test.uid || (test.ctx && test.ctx.test.uid) || 'empty'
    failedTests = failedTests.filter(failed => id !== failed)
  })

  process.on('beforeExit', code => {
    if (failedTests.length) {
      code = 1
    }

    if (code) {
      process.exit(code)
    }
  })
}
