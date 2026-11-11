import assert from 'assert'

Feature('Strings')

Scenario('concats strings', () => {
  console.log('executed: concats strings')
  assert.equal('a' + 'b', 'ab')
})

Scenario('uppercases strings @smoke', () => {
  console.log('executed: uppercases strings')
  assert.equal('a'.toUpperCase(), 'a')
})
