Feature.only('@OnlyFeature')

Scenario('@OnlyScenario1', () => {
  console.log('Only Scenario 1 was executed')
})

Scenario('@OnlyScenario2', () => {
  console.log('Only Scenario 2 was executed')
})

Scenario('@OnlyScenario3', () => {
  console.log('Only Scenario 3 was executed')
})

Feature('@RegularFeature')

Scenario('@RegularScenario1', () => {
  console.log('Regular Scenario 1 should NOT execute')
})

Scenario('@RegularScenario2', () => {
  console.log('Regular Scenario 2 should NOT execute')
})

Feature('@AnotherRegularFeature')

Scenario('@AnotherRegularScenario', () => {
  console.log('Another Regular Scenario should NOT execute')
})
