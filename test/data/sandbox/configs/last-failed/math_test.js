import assert from 'assert'

Feature('Math')

Scenario('adds numbers', () => {
  console.log('executed: adds numbers')
  assert.equal(1 + 1, 2)
})

Scenario('divides numbers @smoke', () => {
  console.log('executed: divides numbers')
  assert.equal(4 / 2, 3)
})

Scenario('multiplies numbers', () => {
  console.log('executed: multiplies numbers')
  assert.equal(2 * 2, process.env.LAST_FAILED_FIXED ? 4 : 5)
})

xScenario('subtracts numbers', () => {
  console.log('executed: subtracts numbers')
})
