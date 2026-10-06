Feature.only('focused')

Scenario('normal', ({ I }) => {
  I.see('ok')
})

Scenario.only('focused', ({ I }) => {
  I.see('ok')
})

Data(['a', 'b']).only.Scenario('data', ({ I, current }) => {
  I.see(current)
})

Scenario.skip('skipped', ({ I }) => {
  I.see('ok')
})
