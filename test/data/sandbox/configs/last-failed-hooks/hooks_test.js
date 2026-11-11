import assert from 'assert'

Feature('Hooks')

BeforeSuite(() => {
  assert.equal(process.env.LAST_FAILED_HOOKS_OK, '1')
})

Scenario('prepares data', () => {
  console.log('executed: prepares data')
})

Scenario('serves requests @smoke', () => {
  console.log('executed: serves requests')
})
