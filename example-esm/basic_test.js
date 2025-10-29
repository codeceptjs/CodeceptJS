Feature('Basic ESM Tests')

Scenario('Demonstrates ESM syntax loading', ({ I }) => {
  // This test simply demonstrates that ESM loading works
  // The test passes if CodeceptJS can load and execute ESM format files

  // Basic JavaScript to verify execution
  const message = 'Hello ESM World!'
  const result = message.includes('ESM')

  if (!result) {
    throw new Error('ESM test failed')
  }
})

Scenario('Demonstrates async/await with ESM', async ({ I }) => {
  // Demonstrate async functionality works in ESM
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

  await delay(10) // Small delay to test async

  const timestamp = new Date().toISOString()
  if (!timestamp.includes('T')) {
    throw new Error('Timestamp test failed')
  }
})
