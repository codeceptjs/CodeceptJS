import { expect } from 'chai'
import { createTest, cloneTest } from '../../../lib/mocha/test.js'
import { createSuite } from '../../../lib/mocha/suite.js'
import MochaSuite from 'mocha/lib/suite.js'
import Test from 'mocha/lib/test.js'
import retryEnhancer from '../../../lib/listener/retryEnhancer.js'
import event from '../../../lib/event.js'

describe('Test cloning for retries', function () {
  it('should maintain consistent fullTitle format after cloning', function () {
    // Create a root suite first
    const rootSuite = new MochaSuite('', null, true)
    // Create a test suite as child
    const suite = createSuite(rootSuite, 'JUnit reporting')

    // Create a test
    const test = createTest('Test 1', () => {})

    // Add test to suite - this sets up the custom fullTitle function
    test.addToSuite(suite)

    const originalTitle = test.fullTitle()
    expect(originalTitle).to.equal('JUnit reporting: Test 1')

    // Clone the test (this is what happens during retries)
    const clonedTest = cloneTest(test)
    const clonedTitle = clonedTest.fullTitle()

    // The cloned test should maintain the same title format with colon
    expect(clonedTitle).to.equal(originalTitle)
    expect(clonedTitle).to.equal('JUnit reporting: Test 1')
  })

  it('should preserve parent-child relationship after cloning', function () {
    const rootSuite = new MochaSuite('', null, true)
    const suite = createSuite(rootSuite, 'Feature Suite')

    const test = createTest('Scenario Test', () => {})
    test.addToSuite(suite)

    const clonedTest = cloneTest(test)

    expect(clonedTest.parent).to.exist
    expect(clonedTest.parent.title).to.equal('Feature Suite')
    expect(clonedTest.fullTitle()).to.equal('Feature Suite: Scenario Test')
  })

  it('should demonstrate the problem: mocha native clone does not preserve CodeceptJS properties', function () {
    // This test demonstrates the issue - it's expected to fail
    // Create a CodeceptJS enhanced test
    const test = createTest('Test with options', () => {})

    // Set some CodeceptJS-specific properties
    test.opts = { timeout: 5000, metadata: 'test-data' }
    test.tags = ['@smoke', '@regression']
    test.notes = [{ type: 'info', text: 'Test note' }]
    test.meta = { feature: 'login', story: 'user-auth' }
    test.artifacts = ['screenshot.png']

    // Simulate what happens during mocha retries - using mocha's native clone method
    const mochaClonedTest = Test.prototype.clone.call(test)

    // These properties are lost due to mocha's shallow clone - this demonstrates the problem
    expect(mochaClonedTest.opts || {}).to.deep.equal({}) // opts are lost
    expect(mochaClonedTest.tags || []).to.deep.equal([]) // tags are lost
    expect(mochaClonedTest.notes || []).to.deep.equal([]) // notes are lost
    expect(mochaClonedTest.meta || {}).to.deep.equal({}) // meta is lost
    expect(mochaClonedTest.artifacts || []).to.deep.equal([]) // artifacts are lost

    // But the retried test should have access to the original
    expect(mochaClonedTest.retriedTest()).to.equal(test)
  })

  it('should preserve CodeceptJS-specific properties when a retried test can access original', function () {
    // Create a CodeceptJS enhanced test
    const originalTest = createTest('Test with options', () => {})

    // Set some CodeceptJS-specific properties
    originalTest.opts = { timeout: 5000, metadata: 'test-data' }
    originalTest.tags = ['@smoke', '@regression']
    originalTest.notes = [{ type: 'info', text: 'Test note' }]
    originalTest.meta = { feature: 'login', story: 'user-auth' }
    originalTest.artifacts = ['screenshot.png']

    // Simulate what happens during mocha retries - using mocha's native clone method
    const retriedTest = Test.prototype.clone.call(originalTest)

    // The retried test should have a reference to the original
    expect(retriedTest.retriedTest()).to.equal(originalTest)

    // We should be able to copy properties from the original test
    const originalProps = originalTest.retriedTest() || originalTest
    expect(originalProps.opts).to.deep.equal({ timeout: 5000, metadata: 'test-data' })
    expect(originalProps.tags).to.deep.equal(['@smoke', '@regression'])
    expect(originalProps.notes).to.deep.equal([{ type: 'info', text: 'Test note' }])
    expect(originalProps.meta).to.deep.equal({ feature: 'login', story: 'user-auth' })
    expect(originalProps.artifacts).to.deep.equal(['screenshot.png'])
  })

  it('should preserve CodeceptJS-specific properties after retryEnhancer processing', function () {
    // Setup the retryEnhancer listener
    retryEnhancer()

    // Create a CodeceptJS enhanced test
    const originalTest = createTest('Test with options', () => {})

    // Set some CodeceptJS-specific properties
    originalTest.opts = { timeout: 5000, metadata: 'test-data' }
    originalTest.tags = ['@smoke', '@regression']
    originalTest.notes = [{ type: 'info', text: 'Test note' }]
    originalTest.meta = { feature: 'login', story: 'user-auth' }
    originalTest.artifacts = ['screenshot.png']
    originalTest.uid = 'test-123'

    // Simulate what happens during mocha retries - using mocha's native clone method
    const retriedTest = Test.prototype.clone.call(originalTest)

    // The retried test should have a reference to the original
    expect(retriedTest.retriedTest()).to.equal(originalTest)

    // Before the retryEnhancer, properties should be missing
    expect(retriedTest.opts || {}).to.deep.equal({})

    // Now trigger the retryEnhancer by emitting the test.before event
    event.emit(event.test.before, retriedTest)

    // After the retryEnhancer processes it, properties should be copied
    expect(retriedTest.opts).to.deep.equal({ timeout: 5000, metadata: 'test-data' })
    expect(retriedTest.tags).to.deep.equal(['@smoke', '@regression'])
    expect(retriedTest.notes).to.deep.equal([{ type: 'info', text: 'Test note' }])
    expect(retriedTest.meta).to.deep.equal({ feature: 'login', story: 'user-auth' })
    expect(retriedTest.artifacts).to.deep.equal(['screenshot.png'])
    expect(retriedTest.uid).to.equal('test-123')

    // Verify that methods are also copied
    expect(retriedTest.addNote).to.be.a('function')
    expect(retriedTest.applyOptions).to.be.a('function')
    expect(retriedTest.simplify).to.be.a('function')
  })
})
