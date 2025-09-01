Scenario('failing test', ({ I }) => {
  throw new Error('This test fails intentionally')
})

Scenario('passing test', ({ I }) => {
  I.amInPath('.')
})
