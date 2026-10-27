Feature('TypeScript step paths')

Scenario('shows original paths', ({ I, fooPage }) => {
  fooPage.open()
  I.failNow('boom')
})
