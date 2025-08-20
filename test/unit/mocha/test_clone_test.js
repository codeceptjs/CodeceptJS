const { expect } = require('chai')
const { createTest, cloneTest } = require('../../../lib/mocha/test')
const { createSuite } = require('../../../lib/mocha/suite')
const MochaSuite = require('mocha/lib/suite')

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
})
