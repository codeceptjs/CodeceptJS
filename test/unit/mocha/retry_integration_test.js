const { expect } = require('chai')
const { createTest } = require('../../../lib/mocha/test')
const { createSuite } = require('../../../lib/mocha/suite')
const MochaSuite = require('mocha/lib/suite')
const retryEnhancer = require('../../../lib/listener/retryEnhancer')
const event = require('../../../lib/event')

describe('Integration test: Retries with CodeceptJS properties', function () {
  beforeEach(function () {
    // Setup the retryEnhancer - this simulates what happens in CodeceptJS init
    retryEnhancer()
  })

  it('should preserve all CodeceptJS properties during real retry scenario', function () {
    // Create a test with retries like: Scenario().retries(2)
    const originalTest = createTest('Test that might fail', () => {
      throw new Error('Simulated failure')
    })

    // Set up test with various CodeceptJS properties that might be used in real scenarios
    originalTest.opts = {
      timeout: 30000,
      metadata: 'important-test',
      retries: 2,
      feature: 'login',
    }
    originalTest.tags = ['@critical', '@smoke', '@login']
    originalTest.notes = [
      { type: 'info', text: 'This test validates user login' },
      { type: 'warning', text: 'May be flaky due to external service' },
    ]
    originalTest.meta = {
      feature: 'authentication',
      story: 'user-login',
      priority: 'high',
      team: 'qa',
    }
    originalTest.artifacts = ['login-screenshot.png', 'network-log.json']
    originalTest.uid = 'auth-test-001'
    originalTest.config = { helper: 'playwright', baseUrl: 'http://test.com' }
    originalTest.inject = { userData: { email: 'test@example.com' } }

    // Add some steps to simulate CodeceptJS test steps
    originalTest.steps = [
      { title: 'I am on page "/login"', status: 'success' },
      { title: 'I fill field "email", "test@example.com"', status: 'success' },
      { title: 'I fill field "password", "secretpassword"', status: 'success' },
      { title: 'I click "Login"', status: 'failed' },
    ]

    // Enable retries
    originalTest.retries(2)

    // Now simulate what happens during mocha retry
    const retriedTest = originalTest.clone()

    // Verify that the retried test has reference to original
    expect(retriedTest.retriedTest()).to.equal(originalTest)

    // Before our fix, these properties would be lost
    expect(retriedTest.opts || {}).to.deep.equal({})
    expect(retriedTest.tags || []).to.deep.equal([])

    // Now trigger our retryEnhancer (this happens automatically in CodeceptJS)
    event.emit(event.test.before, retriedTest)

    // After our fix, all properties should be preserved
    expect(retriedTest.opts).to.deep.equal({
      timeout: 30000,
      metadata: 'important-test',
      retries: 2,
      feature: 'login',
    })
    expect(retriedTest.tags).to.deep.equal(['@critical', '@smoke', '@login'])
    expect(retriedTest.notes).to.deep.equal([
      { type: 'info', text: 'This test validates user login' },
      { type: 'warning', text: 'May be flaky due to external service' },
    ])
    expect(retriedTest.meta).to.deep.equal({
      feature: 'authentication',
      story: 'user-login',
      priority: 'high',
      team: 'qa',
    })
    expect(retriedTest.artifacts).to.deep.equal(['login-screenshot.png', 'network-log.json'])
    expect(retriedTest.uid).to.equal('auth-test-001')
    expect(retriedTest.config).to.deep.equal({ helper: 'playwright', baseUrl: 'http://test.com' })
    expect(retriedTest.inject).to.deep.equal({ userData: { email: 'test@example.com' } })
    expect(retriedTest.steps).to.deep.equal([
      { title: 'I am on page "/login"', status: 'success' },
      { title: 'I fill field "email", "test@example.com"', status: 'success' },
      { title: 'I fill field "password", "secretpassword"', status: 'success' },
      { title: 'I click "Login"', status: 'failed' },
    ])

    // Verify that enhanced methods are available
    expect(retriedTest.addNote).to.be.a('function')
    expect(retriedTest.applyOptions).to.be.a('function')
    expect(retriedTest.simplify).to.be.a('function')

    // Test that we can use the methods
    retriedTest.addNote('retry', 'Attempt #2')
    expect(retriedTest.notes).to.have.length(3)
    expect(retriedTest.notes[2]).to.deep.equal({ type: 'retry', text: 'Attempt #2' })

    // Verify the test is enhanced with CodeceptJS functionality
    expect(retriedTest.codeceptjs).to.be.true
  })
})
