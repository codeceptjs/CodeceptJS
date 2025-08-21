// Edge case test with special characters and complex titles
Feature.only('Feature with special chars: @test [brackets] (parens) & symbols')

Scenario('Scenario with special chars: @test [brackets] & symbols', () => {
  console.log('Special chars scenario executed')
})

Scenario('Normal scenario', () => {
  console.log('Normal scenario executed')
})

Feature('Regular Feature That Should Not Run')

Scenario('Should not run scenario', () => {
  console.log('This should never execute')
})
