Feature('Basic ESM Tests')

Scenario('Test basic assertions', ({ I }) => {
  I.log('Starting basic assertion tests')

  // Test equality
  I.assertEqual(1 + 1, 2, 'Math should work')
  I.assertNotEqual('hello', 'world', 'Strings should be different')

  // Test boolean values
  I.assertTrue(true, 'True should be true')
  I.assertFalse(false, 'False should be false')

  // Test existence
  I.assertExists('not empty', 'String should exist')
  I.assertNotExists(null, 'Null should not exist')

  // Test arrays and strings
  const testArray = [1, 2, 3, 'test']
  I.assertContains(testArray, 'test', 'Array should contain test string')
  I.assertNotContains(testArray, 'missing', 'Array should not contain missing item')

  const testString = 'Hello CodeceptJS ESM World'
  I.assertContains(testString, 'ESM', 'String should contain ESM')
  I.assertNotContains(testString, 'CJS', 'String should not contain CJS')

  // Test numbers
  I.assertGreaterThan(10, 5, '10 should be greater than 5')
  I.assertLessThan(3, 7, '3 should be less than 7')

  I.log('All basic assertions passed!')
})

Scenario('Test utility functions', async ({ I }) => {
  I.log('Testing utility functions')

  // Test timestamp - helper methods return promises in CodeceptJS
  const timestamp = await I.getCurrentTimestamp()
  I.assertExists(timestamp, 'Timestamp should exist')
  I.assertTrue(timestamp.includes('T'), 'Timestamp should be in ISO format')

  // Test random string generation
  const randomStr1 = await I.generateRandomString(5)
  const randomStr2 = await I.generateRandomString(5)
  I.assertEqual(randomStr1.length, 5, 'Random string should be 5 chars')
  I.assertNotEqual(randomStr1, randomStr2, 'Random strings should be different')

  I.log('Utility function tests passed!')
})

Scenario('Test error handling', ({ I }) => {
  I.log('Testing error handling')

  // Test function that throws
  I.assertThrows(() => {
    throw new Error('Test error')
  }, 'Function should throw error')

  // Test function that doesn't throw
  I.assertDoesNotThrow(() => {
    return 'no error'
  }, 'Function should not throw error')

  I.log('Error handling tests passed!')
})
