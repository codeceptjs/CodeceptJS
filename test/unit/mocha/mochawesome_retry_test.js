const { expect } = require('chai')
const { createTest } = require('../../../lib/mocha/test')
const { createSuite } = require('../../../lib/mocha/suite')
const MochaSuite = require('mocha/lib/suite')
const Test = require('mocha/lib/test')
const Mochawesome = require('../../../lib/helper/Mochawesome')
const retryEnhancer = require('../../../lib/listener/retryEnhancer')
const event = require('../../../lib/event')

describe('MochawesomeHelper with retries', function () {
  let helper

  beforeEach(function () {
    helper = new Mochawesome({})
    // Setup the retryEnhancer
    retryEnhancer()
  })

  it('should add context to the correct test object when test is retried', function () {
    // Create a CodeceptJS enhanced test
    const originalTest = createTest('Test with mochawesome context', () => {})

    // Create a mock suite and set up context
    const rootSuite = new MochaSuite('', null, true)
    const suite = createSuite(rootSuite, 'Test Suite')
    originalTest.addToSuite(suite)

    // Set some CodeceptJS-specific properties
    originalTest.opts = { timeout: 5000 }
    originalTest.meta = { feature: 'reporting' }

    // Simulate what happens during mocha retries - using mocha's native clone method
    const retriedTest = Test.prototype.clone.call(originalTest)

    // Trigger the retryEnhancer to copy properties
    event.emit(event.test.before, retriedTest)

    // Verify that properties were copied
    expect(retriedTest.opts).to.deep.equal({ timeout: 5000 })
    expect(retriedTest.meta).to.deep.equal({ feature: 'reporting' })

    // Now simulate the test lifecycle hooks
    helper._beforeSuite(suite)
    helper._test(retriedTest) // This should set currentTest to the retried test

    // Add some context using the helper
    const contextData = { screenshot: 'test.png', url: 'http://example.com' }

    // Mock the _addContext method to capture what test object is passed
    let contextAddedToTest = null
    helper._addContext = function (testWrapper, context) {
      contextAddedToTest = testWrapper.test
      return Promise.resolve()
    }

    // Add context
    helper.addMochawesomeContext(contextData)

    // The context should be added to the retried test, not the original
    expect(contextAddedToTest).to.equal(retriedTest)
    expect(contextAddedToTest).to.not.equal(originalTest)

    // Verify the retried test has the enhanced properties
    expect(contextAddedToTest.opts).to.deep.equal({ timeout: 5000 })
    expect(contextAddedToTest.meta).to.deep.equal({ feature: 'reporting' })
  })

  it('should add context to normal test when not retried', function () {
    // Create a normal (non-retried) CodeceptJS enhanced test
    const normalTest = createTest('Normal test', () => {})

    // Create a mock suite
    const rootSuite = new MochaSuite('', null, true)
    const suite = createSuite(rootSuite, 'Test Suite')
    normalTest.addToSuite(suite)

    // Simulate the test lifecycle hooks
    helper._beforeSuite(suite)
    helper._test(normalTest)

    // Mock the _addContext method to capture what test object is passed
    let contextAddedToTest = null
    helper._addContext = function (testWrapper, context) {
      contextAddedToTest = testWrapper.test
      return Promise.resolve()
    }

    // Add some context using the helper
    const contextData = { screenshot: 'normal.png' }
    helper.addMochawesomeContext(contextData)

    // The context should be added to the normal test
    expect(contextAddedToTest).to.equal(normalTest)

    // Verify this is not a retried test
    expect(normalTest.retriedTest()).to.be.undefined
  })
})
