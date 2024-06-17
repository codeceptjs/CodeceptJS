const event = require('../event')
const container = require('../container')

module.exports = function () {
  let mocha

  event.dispatcher.on(event.all.before, () => {
    mocha = container.mocha()
  })

  event.dispatcher.on(event.test.passed, (test) => {
    mocha.Runner.emit('pass', test)
  })

  event.dispatcher.on(event.test.failed, (test, err) => {
    test.state = 'failed'
    mocha.Runner.emit('fail', test, err)
  })
}
