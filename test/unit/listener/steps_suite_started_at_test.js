import { expect } from 'chai'
import event from '../../../lib/event.js'
import recorder from '../../../lib/recorder.js'

import stepsListener from '../../../lib/listener/steps.js'

// junitReporter reads `suite.startedAt` for each `<testsuite timestamp>`.
// Mocha never sets it, so before this listener existed the reporter fell back
// to `new Date()` at write time. (#5668)
describe('Steps Listener - suite.startedAt', () => {
  beforeEach(() => {
    recorder.reset()
    recorder.start()
    event.cleanDispatcher()
    stepsListener()
  })

  afterEach(() => {
    event.cleanDispatcher()
    recorder.reset()
  })

  it('stamps the suite when it starts', () => {
    const suite = { title: 'Login' }
    const before = Date.now()

    event.emit(event.suite.before, suite)

    expect(suite.startedAt).to.be.a('number')
    expect(suite.startedAt).to.be.at.least(before)
    expect(suite.startedAt).to.be.at.most(Date.now())
  })

  it('stamps each suite independently', () => {
    const first = { title: 'Login' }
    const second = { title: 'Dashboard' }

    event.emit(event.suite.before, first)
    event.emit(event.suite.before, second)

    expect(first.startedAt).to.be.a('number')
    expect(second.startedAt).to.be.a('number')
    expect(second.startedAt).to.be.at.least(first.startedAt)
  })
})
