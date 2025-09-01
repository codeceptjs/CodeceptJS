Feature('Failed Tests')

Scenario('should pass test', ({ I }) => {
  // This test should pass
})

Scenario('should fail test 1', ({ I }) => {
  // This test should fail
  throw new Error('Test 1 failed')
})

Scenario('should fail test 2', ({ I }) => {
  // This test should fail
  throw new Error('Test 2 failed')
})

Scenario('should pass test 2', ({ I }) => {
  // This test should pass
})
