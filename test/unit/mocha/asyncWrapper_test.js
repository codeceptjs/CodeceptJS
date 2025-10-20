let expect
import('chai').then(chai => {
  expect = chai.expect
})
const sinon = require('sinon')

const { test: testWrapper, setup, teardown, suiteSetup, suiteTeardown } = require('../../../lib/mocha/asyncWrapper')
const recorder = require('../../../lib/recorder')
const event = require('../../../lib/event')

let test
let fn
let before
let after
let beforeSuite
let afterSuite
let failed
let started

describe('AsyncWrapper', () => {
  beforeEach(() => {
    test = { timeout: () => {} }
    fn = sinon.spy()
    test.fn = fn
  })
  beforeEach(() => recorder.reset())
  afterEach(() => event.cleanDispatcher())

  it('should wrap test function', () => {
    testWrapper(test).fn(() => {})
    expect(fn.called).is.ok
  })

  it('should work with async func', () => {
    let counter = 0
    test.fn = () => {
      recorder.add('test', async () => {
        counter++
        counter++
        counter++
        counter++
      })
    }

    setup()
    testWrapper(test).fn(() => null)
    recorder.add('validation', () => expect(counter).to.eq(4))
    return recorder.promise()
  })

  describe('events', () => {
    beforeEach(() => {
      event.dispatcher.on(event.test.before, (before = sinon.spy()))
      event.dispatcher.on(event.test.after, (after = sinon.spy()))
      event.dispatcher.on(event.test.started, (started = sinon.spy()))
      event.dispatcher.on(event.suite.before, (beforeSuite = sinon.spy()))
      event.dispatcher.on(event.suite.after, (afterSuite = sinon.spy()))
      suiteSetup()
      setup()
    })

    it('should fire events', () => {
      recorder.reset()
      testWrapper(test).fn(() => null)
      expect(started.called).is.ok
      teardown()
      suiteTeardown()
      return recorder
        .promise()
        .then(() => expect(beforeSuite.called).is.ok)
        .then(() => expect(afterSuite.called).is.ok)
        .then(() => expect(before.called).is.ok)
        .then(() => expect(after.called).is.ok)
    })

    it('should fire failed event on error', () => {
      event.dispatcher.on(event.test.failed, (failed = sinon.spy()))
      setup()
      test.fn = () => {
        throw new Error('ups')
      }
      testWrapper(test).fn(() => {})
      return recorder
        .promise()
        .then(() => expect(failed.called).is.ok)
        .catch(() => null)
    })

    it('should fire failed event on async error', () => {
      test.fn = () => {
        recorder.throw(new Error('ups'))
      }
      testWrapper(test).fn(() => {})
      return recorder
        .promise()
        .then(() => expect(failed.called).is.ok)
        .catch(() => null)
    })
  })
})
