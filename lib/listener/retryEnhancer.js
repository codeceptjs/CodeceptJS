const event = require('../event')
const { enhanceMochaTest } = require('../mocha/test')

/**
 * Enhance retried tests by copying CodeceptJS-specific properties from the original test
 * This fixes the issue where Mocha's shallow clone during retries loses CodeceptJS properties
 */
module.exports = function () {
  event.dispatcher.on(event.test.before, test => {
    // Check if this test is a retry (has a reference to the original test)
    const originalTest = test.retriedTest && test.retriedTest()

    if (originalTest) {
      // This is a retried test - copy CodeceptJS-specific properties from the original
      copyCodeceptJSProperties(originalTest, test)

      // Ensure the test is enhanced with CodeceptJS functionality
      enhanceMochaTest(test)
    }
  })
}

/**
 * Copy CodeceptJS-specific properties from the original test to the retried test
 * @param {CodeceptJS.Test} originalTest - The original test object
 * @param {CodeceptJS.Test} retriedTest - The retried test object
 */
function copyCodeceptJSProperties(originalTest, retriedTest) {
  // Copy CodeceptJS-specific properties
  if (originalTest.opts !== undefined) {
    retriedTest.opts = originalTest.opts ? { ...originalTest.opts } : {}
  }

  if (originalTest.tags !== undefined) {
    retriedTest.tags = originalTest.tags ? [...originalTest.tags] : []
  }

  if (originalTest.notes !== undefined) {
    retriedTest.notes = originalTest.notes ? [...originalTest.notes] : []
  }

  if (originalTest.meta !== undefined) {
    retriedTest.meta = originalTest.meta ? { ...originalTest.meta } : {}
  }

  if (originalTest.artifacts !== undefined) {
    retriedTest.artifacts = originalTest.artifacts ? [...originalTest.artifacts] : []
  }

  if (originalTest.steps !== undefined) {
    retriedTest.steps = originalTest.steps ? [...originalTest.steps] : []
  }

  if (originalTest.config !== undefined) {
    retriedTest.config = originalTest.config ? { ...originalTest.config } : {}
  }

  if (originalTest.inject !== undefined) {
    retriedTest.inject = originalTest.inject ? { ...originalTest.inject } : {}
  }

  // Copy methods that might be missing
  if (originalTest.addNote && !retriedTest.addNote) {
    retriedTest.addNote = function (type, note) {
      this.notes = this.notes || []
      this.notes.push({ type, text: note })
    }
  }

  if (originalTest.applyOptions && !retriedTest.applyOptions) {
    retriedTest.applyOptions = originalTest.applyOptions.bind(retriedTest)
  }

  if (originalTest.simplify && !retriedTest.simplify) {
    retriedTest.simplify = originalTest.simplify.bind(retriedTest)
  }

  // Preserve the uid if it exists
  if (originalTest.uid !== undefined) {
    retriedTest.uid = originalTest.uid
  }

  // Mark as enhanced
  retriedTest.codeceptjs = true
}
